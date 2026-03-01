import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';

const VIRTUAL_MODULE_ID = 'virtual:posts';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

// ── Topic metadata ──
const TOPIC_META = {
  tech: { title: '기술', emoji: '💻', icon: '&#xe3af;' },
  life: { title: '일상', emoji: '🌿' },
  travel: { title: '여행', emoji: '✈️' },
  book: { title: '독서', emoji: '📚' },
};

// Topic display order
const TOPIC_ORDER = ['tech', 'life', 'travel', 'book'];

export default function markdownPostsPlugin() {
  const md = new MarkdownIt({ html: true, typographer: true });
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

        const html = md.render(content);
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

  return {
    name: 'markdown-posts',

    configResolved(config) {
      contentDir = path.resolve(config.root, 'content');
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const topics = buildTopics();
        return `export const topics = ${JSON.stringify(topics, null, 2)};`;
      }
    },

    handleHotUpdate({ file, server }) {
      if (file.endsWith('.md') && file.includes(path.sep + 'content' + path.sep)) {
        // Invalidate the virtual module when any .md file changes
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
          return [mod];
        }
      }
    },
  };
}
