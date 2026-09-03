import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import hljs from 'highlight.js/lib/common';
import MarkdownIt from 'markdown-it';
import { buildVoiceCatalog, VIRTUAL_VOICE_UNIT_PREFIX } from './voice-content.js';

const VIRTUAL_MODULE_ID = 'virtual:posts';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;
const VIRTUAL_VOICE_MODULE_ID = 'virtual:voice-contents';
const RESOLVED_VIRTUAL_VOICE_MODULE_ID = '\0' + VIRTUAL_VOICE_MODULE_ID;
const RESOLVED_VIRTUAL_VOICE_UNIT_PREFIX = '\0' + VIRTUAL_VOICE_UNIT_PREFIX;

// ── Topic metadata ──
const TOPIC_META = {
  eng: { title: '공학', emoji: '⚙️' },
  lang: { title: '언어', emoji: '🔤' },
  math: { title: '수학', emoji: '➗', icon: '&#xe3af;' },
  phil: { title: '철학', emoji: '📚' },
};

// Topic display order
const TOPIC_ORDER = ['eng', 'lang', 'math', 'phil'];

export default function markdownPostsPlugin() {
  // WARNING: html: true allows raw HTML in markdown files.
  // Only enable this if you trust all content authors.
  // If you don't need raw HTML in posts, set html: false for safety.
  const md = new MarkdownIt({
    html: true,
    typographer: true,
    highlight(source, languageName) {
      const requestedLanguage = languageName.trim().split(/\s+/)[0].toLowerCase();
      const result = requestedLanguage && hljs.getLanguage(requestedLanguage)
        ? hljs.highlight(source, { language: requestedLanguage, ignoreIllegals: true })
        : hljs.highlightAuto(source);
      const resolvedLanguage = result.language || requestedLanguage || 'plaintext';
      const languageLabel = resolvedLanguage === 'plaintext' ? 'TEXT' : resolvedLanguage.toUpperCase();

      return `<pre class="code-block" data-language="${md.utils.escapeHtml(languageLabel)}"><code class="hljs language-${md.utils.escapeHtml(resolvedLanguage)}">${result.value}</code></pre>`;
    },
  });
  const defaultValidateLink = md.validateLink.bind(md);
  md.validateLink = (url) => /^post:\/\//.test(url) || defaultValidateLink(url);
  let contentDir;
  let projectRoot;
  let voiceCatalog = { works: [], unitsByVirtualId: new Map(), filesByVirtualId: new Map() };

  function buildTopics() {
    const topicMap = {};

    // Initialize topics in order
    for (const topicId of TOPIC_ORDER) {
      const meta = TOPIC_META[topicId];
      if (meta) {
        topicMap[topicId] = {
          id: topicId,
          ...meta,
          posts: [],
        };
      }
    }

    // Read all .md files from content/
    const contentPath = contentDir;
    if (!fs.existsSync(contentPath)) return Object.values(topicMap);

    const topicDirs = fs.readdirSync(contentPath, { withFileTypes: true });

    for (const dir of topicDirs) {
      if (!dir.isDirectory()) continue;
      const topicId = dir.name;
      const topicPath = path.join(contentPath, topicId);
      const files = fs.readdirSync(topicPath).filter((f) => f.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(topicPath, file);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const { data: frontmatter, content } = matter(raw);

        const html = md.render(content)
          .replace(/href="post:\/\/([^"]+)"/g, 'href="#" data-post-link="$1" class="internal-link"');
        const resolvedTopicId = frontmatter.topic || topicId;

        // Ensure the topic exists in map
        if (!topicMap[resolvedTopicId]) {
          topicMap[resolvedTopicId] = {
            id: resolvedTopicId,
            title: resolvedTopicId,
            emoji: '📄',
            posts: [],
          };
        }

        topicMap[resolvedTopicId].posts.push({
          id: frontmatter.id || path.basename(file, '.md'),
          title: frontmatter.title || 'Untitled',
          date: frontmatter.date
            ? new Date(frontmatter.date).toISOString().split('T')[0]
            : '1970-01-01',
          content: html,
        });
      }
    }

    // Sort posts by date descending within each topic
    for (const topic of Object.values(topicMap)) {
      topic.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Return topics in defined order, filtering out empty topics
    return TOPIC_ORDER.map((id) => topicMap[id]).filter(
      (t) => t && t.posts.length > 0
    );
  }

  function refreshVoiceCatalog() {
    voiceCatalog = buildVoiceCatalog({ contentDir, projectRoot });
    return voiceCatalog;
  }

  function voiceCatalogModuleSource() {
    const { works } = refreshVoiceCatalog();
    const source = works.map((work) => {
      const units = work.units.map(({ virtualId, ...unit }) => (
        `{...${JSON.stringify(unit)},load:()=>import(${JSON.stringify(virtualId)}).then(module=>module.default)}`
      ));
      const { units: ignoredUnits, audio: ignoredAudio, ...metadata } = work;
      return `{...${JSON.stringify(metadata)},units:[${units.join(',')}]}`;
    });
    return `export const voiceContents = [${source.join(',')}];`;
  }

  return {
    name: 'markdown-posts',

    configResolved(config) {
      projectRoot = config.root;
      contentDir = path.resolve(config.root, 'content');
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
      if (id === VIRTUAL_VOICE_MODULE_ID) {
        return RESOLVED_VIRTUAL_VOICE_MODULE_ID;
      }
      if (id.startsWith(VIRTUAL_VOICE_UNIT_PREFIX)) {
        return `\0${id}`;
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const topics = buildTopics();
        return `export const topics = ${JSON.stringify(topics, null, 2)};`;
      }
      if (id === RESOLVED_VIRTUAL_VOICE_MODULE_ID) {
        return voiceCatalogModuleSource();
      }
      if (id.startsWith(RESOLVED_VIRTUAL_VOICE_UNIT_PREFIX)) {
        const virtualId = id.slice(1);
        if (!voiceCatalog.unitsByVirtualId.has(virtualId)) refreshVoiceCatalog();
        const passages = voiceCatalog.unitsByVirtualId.get(virtualId);
        if (!passages) throw new Error(`[voice-contents] 알 수 없는 단위 모듈입니다: ${virtualId}`);
        return `export default ${JSON.stringify(passages)};`;
      }
    },

    handleHotUpdate({ file, server }) {
      const modules = [];
      if (file.endsWith('.md') && file.includes(path.sep + 'content' + path.sep)) {
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
          modules.push(mod);
        }
      }
      if (file.endsWith('.json') && file.includes(path.sep + 'content' + path.sep + 'voice' + path.sep)) {
        const previousCatalog = voiceCatalog;
        refreshVoiceCatalog();
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_VOICE_MODULE_ID);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
          modules.push(mod);
        }
        for (const [virtualId, unitFile] of previousCatalog.filesByVirtualId) {
          if (path.resolve(unitFile) !== path.resolve(file)) continue;
          const unitModule = server.moduleGraph.getModuleById(`\0${virtualId}`);
          if (unitModule) {
            server.moduleGraph.invalidateModule(unitModule);
            modules.push(unitModule);
          }
        }
      }
      if (modules.length > 0) return modules;
    },
  };
}
