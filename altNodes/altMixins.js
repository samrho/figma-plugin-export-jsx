export class AltRectangleNode {
    constructor() {
        this.type = "RECTANGLE";
    }
}
export class AltEllipseNode {
    constructor() {
        this.type = "ELLIPSE";
    }
}
export class AltFrameNode {
    constructor() {
        this.type = "FRAME";
    }
}
export class AltGroupNode {
    constructor() {
        this.type = "GROUP";
    }
}
export class AltTextNode {
    constructor() {
        this.type = "TEXT";
    }
}
// // DOCUMENT
// class AltDocumentNode {
//   type = "DOCUMENT";
//   children = [];
// }
// // PAGE
// class AltPageNode {
//   type = "PAGE";
//   children = [];
//   _selection: Array<SceneNode> = [];
//   get selection() {
//     return this._selection || [];
//   }
//   set selection(value) {
//     this._selection = value;
//   }
// }
