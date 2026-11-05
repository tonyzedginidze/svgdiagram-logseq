import '../vendor/logseq-sdk/src/LSPlugin.user.ts';
import { createApp } from 'vue';
import Maker from '../../obsidian/src/App.vue';
import '../../obsidian/src/style.css';
import '../../browser/src/style.css';
import './style.css';

let target = null;

async function openMaker() {
  const graph = await logseq.App.getCurrentGraph();
  const block = await logseq.Editor.getCurrentBlock();
  if (!graph || !block) {
    await logseq.UI.showMsg('Select a block before opening SVG Diagram.', 'warning');
    return;
  }
  target = { graph: graph.name, block: block.uuid };
  logseq.showMainUI();
}

async function insert({ svg, name }) {
  if (!target || (await logseq.App.getCurrentGraph())?.name !== target.graph) throw new Error('The graph changed. Select a block and reopen SVG Diagram.');
  if (!(await logseq.Editor.getBlock(target.block))) throw new Error('The selected block no longer exists.');
  const filename = `${(name || 'diagram').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'diagram'}-${crypto.randomUUID()}.svg`;
  const storage = logseq.Assets.makeSandboxStorage();
  await storage.setItem(filename, svg);
  try {
    await logseq.Editor.insertBlock(target.block, `![${filename}](../assets/storages/${logseq.baseInfo.id}/${filename})`, { sibling: true });
  } catch (error) {
    await storage.removeItem(filename);
    throw error;
  }
  logseq.hideMainUI();
}

async function main() {
  document.body.classList.add('svgdiagram-modal');
  createApp(Maker, { makerOnly: true, target: 'Insert the SVG after the selected block', insert }).mount('#app');
  logseq.App.registerCommandPalette({ key: 'svgdiagram.open', label: 'SVG Diagram: Create a diagram' }, openMaker);
  logseq.Editor.registerSlashCommand('SVG Diagram', openMaker);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') logseq.hideMainUI({ restoreEditingCursor: true }); });
}

logseq.ready(main).catch(error => console.error('SVG Diagram failed to start:', error));
