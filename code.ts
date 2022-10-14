
figma.showUI(__html__, {width: 450, height: 550});

let parentId: string;

const run = () => {
  if (figma.currentPage.selection.length === 0) {
    figma.ui.postMessage({
      type: 'empty'
    })
    console.log('empty');
    return;
  }
  

  parentId = figma.currentPage.selection[0].parent?.id ?? '';

  let result = '';

  console.log(figma.currentPage);
  console.log(figma.currentPage.selection);
  console.log(figma.currentPage.selection[0]);
  console.log(figma.currentPage.selection[0].parent);
}


figma.on("selectionchange", () => {
  console.log('run');
  run();
})

figma.on("run", () => {
  console.log('run');
  run();
})

figma.ui.onmessage = msg => {
  console.log('latest');
  const {editorType} = figma;
  console.log({msg, root: figma.root.children});

  // TODO: Figma to Code extension 참고
  if (msg.type === 'empty') {
   
  } 

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  figma.closePlugin();
};

















// archive
// figma.ui.onmessage = msg => {
//   console.log('latest');
//   const {editorType} = figma;
//   console.log({msg, root: figma.root.children});

//   // TODO: Figma to Code extension 참고
//   if (msg.type === 'create-rectangles') {
//     const nodes: SceneNode[] = [];
    
//     for (let i = 0; i < msg.count; i++) {
//       const rect = figma.createRectangle();
//       rect.x = i * 150;
//       rect.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
//       figma.currentPage.appendChild(rect);
//       nodes.push(rect);
//     }
//     figma.currentPage.selection = nodes;
//     figma.viewport.scrollAndZoomIntoView(nodes);
//   } else if (msg.type === 'opacity-change') {
    
//     figma.currentPage.selection.forEach((node) => {
//       if ("opacity" in node) {
//         node.opacity *= 0.5;
//       }
//     })
//   } 

//   // Make sure to close the plugin when you're done. Otherwise the plugin will
//   // keep running, which shows the cancel button at the bottom of the screen.
//   figma.closePlugin();
// };
