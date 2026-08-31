import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';

const VIRTUAL_MODULE_ID = 'virtual:posts';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;
const VIRTUAL_VOICE_MODULE_ID = 'virtual:voice-contents';
const RESOLVED_VIRTUAL_VOICE_MODULE_ID = '\0' + VIRTUAL_VOICE_MODULE_ID;

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
  const md = new MarkdownIt({ html: true, typographer: true });
  const defaultValidateLink = md.validateLink.bind(md);
  md.validateLink = (url) => /^post:\/\//.test(url) || defaultValidateLink(url);
  let contentDir;

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

  function buildVoiceContents() {
    const voicePath = path.join(contentDir, 'voice');
    if (!fs.existsSync(voicePath)) return [];
    const seenIds = new Set();

    return fs
      .readdirSync(voicePath)
      .filter((file) => file.endsWith('.json'))
      .map((file) => {
        const filePath = path.join(voicePath, file);
        let data;
        try {
          data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (error) {
          throw new Error(`[voice-contents] ${file}: 올바른 JSON 파일이 아닙니다. ${error.message}`);
        }

        if (!data.id || !data.titles?.korean || !data.titles?.english || !data.titles?.greek) {
          throw new Error(`[voice-contents] ${file}: id와 titles.korean/english/greek이 필요합니다.`);
        }
        if (!Array.isArray(data.lines)) {
          throw new Error(`[voice-contents] ${file}: lines는 배열이어야 합니다.`);
        }
        if (seenIds.has(data.id)) {
          throw new Error(`[voice-contents] ${file}: 중복된 id "${data.id}"가 있습니다.`);
        }
        seenIds.add(data.id);

        const lines = data.lines.map((line, index) => {
          const lineNumber = Number(line.number) || index + 1;
          const text = String(line.text || '').trim();
          const audio = line.audio ? String(line.audio) : null;
          if (!text) {
            throw new Error(`[voice-contents] ${file}: ${lineNumber}행의 text가 비어 있습니다.`);
          }
          if (audio?.startsWith('/')) {
            const audioPath = path.join(path.dirname(contentDir), 'public', audio.slice(1));
            if (!fs.existsSync(audioPath)) {
              throw new Error(`[voice-contents] ${file}: ${lineNumber}행의 음성 파일을 찾을 수 없습니다: ${audio}`);
            }
          }
          return {
            number: lineNumber,
            text,
            audio,
            note: line.note ? String(line.note) : null,
          };
        });

        return {
          id: data.id,
          order: Number(data.order) || 999,
          greek: data.titles.greek,
          english: data.titles.english,
          korean: data.titles.korean,
          book: String(data.book || 'I'),
          lines,
        };
      })
      .sort((a, b) => a.order - b.order || a.korean.localeCompare(b.korean, 'ko'));
  }

  return {
    name: 'markdown-posts',

    configResolved(config) {
      contentDir = path.resolve(config.root, 'content');
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
      if (id === VIRTUAL_VOICE_MODULE_ID) {
        return RESOLVED_VIRTUAL_VOICE_MODULE_ID;
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const topics = buildTopics();
        return `export const topics = ${JSON.stringify(topics, null, 2)};`;
      }
      if (id === RESOLVED_VIRTUAL_VOICE_MODULE_ID) {
        const voiceContents = buildVoiceContents();
        return `export const voiceContents = ${JSON.stringify(voiceContents, null, 2)};`;
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
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_VOICE_MODULE_ID);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
          modules.push(mod);
        }
      }
      if (modules.length > 0) return modules;
    },
  };
}
