import { convertNodesOnRectangle } from "./convertNodesOnRectangle";
import { AltRectangleNode, AltFrameNode, AltTextNode, AltGroupNode, AltEllipseNode, } from "./altMixins";
import { convertToAutoLayout } from "./convertToAutoLayout";
export const convertSingleNodeToAlt = (node, parent = null) => {
    return convertIntoAltNodes([node], parent)[0];
};
export const frameNodeToAlt = (node, altParent = null) => {
    if (node.children.length === 0) {
        // if it has no children, convert frame to rectangle
        return frameToRectangleNode(node, altParent);
    }
    const altNode = new AltFrameNode();
    altNode.id = node.id;
    altNode.name = node.name;
    if (altParent) {
        altNode.parent = altParent;
    }
    convertDefaultShape(altNode, node);
    convertFrame(altNode, node);
    convertCorner(altNode, node);
    convertRectangleCorner(altNode, node);
    altNode.children = convertIntoAltNodes(node.children, altNode);
    return convertToAutoLayout(convertNodesOnRectangle(altNode));
};
// auto convert Frame to Rectangle when Frame has no Children
const frameToRectangleNode = (node, altParent) => {
    const newNode = new AltRectangleNode();
    newNode.id = node.id;
    newNode.name = node.name;
    if (altParent) {
        newNode.parent = altParent;
    }
    convertDefaultShape(newNode, node);
    convertRectangleCorner(newNode, node);
    convertCorner(newNode, node);
    return newNode;
};
export const convertIntoAltNodes = (sceneNode, altParent = null) => {
    const mapped = sceneNode.map((node) => {
        if (node.type === "RECTANGLE" || node.type === "ELLIPSE") {
            let altNode;
            if (node.type === "RECTANGLE") {
                altNode = new AltRectangleNode();
                convertRectangleCorner(altNode, node);
            }
            else {
                altNode = new AltEllipseNode();
            }
            altNode.id = node.id;
            altNode.name = node.name;
            if (altParent) {
                altNode.parent = altParent;
            }
            convertDefaultShape(altNode, node);
            convertCorner(altNode, node);
            return altNode;
        }
        else if (node.type === "LINE") {
            const altNode = new AltRectangleNode();
            altNode.id = node.id;
            altNode.name = node.name;
            if (altParent) {
                altNode.parent = altParent;
            }
            convertDefaultShape(altNode, node);
            // Lines have a height of zero, but they must have a height, so add 1.
            altNode.height = 1;
            // Let them be CENTER, since on Lines this property is ignored.
            altNode.strokeAlign = "CENTER";
            // Remove 1 since it now has a height of 1. It won't be visually perfect, but will be almost.
            altNode.strokeWeight = altNode.strokeWeight - 1;
            return altNode;
        }
        else if (node.type === "FRAME" ||
            node.type === "INSTANCE" ||
            node.type === "COMPONENT") {
            const iconToRect = iconToRectangle(node, altParent);
            if (iconToRect != null) {
                return iconToRect;
            }
            return frameNodeToAlt(node, altParent);
        }
        else if (node.type === "GROUP") {
            if (node.children.length === 1 && node.visible !== false) {
                // if Group is visible and has only one child, Group should disappear.
                // there will be a single value anyway.
                return convertIntoAltNodes(node.children, altParent)[0];
            }
            const iconToRect = iconToRectangle(node, altParent);
            if (iconToRect != null) {
                return iconToRect;
            }
            const altNode = new AltGroupNode();
            altNode.id = node.id;
            altNode.name = node.name;
            if (altParent) {
                altNode.parent = altParent;
            }
            convertLayout(altNode, node);
            convertBlend(altNode, node);
            altNode.children = convertIntoAltNodes(node.children, altNode);
            // try to find big rect and regardless of that result, also try to convert to autolayout.
            // There is a big chance this will be returned as a Frame
            // also, Group will always have at least 2 children.
            return convertNodesOnRectangle(altNode);
        }
        else if (node.type === "TEXT") {
            const altNode = new AltTextNode();
            altNode.id = node.id;
            altNode.name = node.name;
            if (altParent) {
                altNode.parent = altParent;
            }
            convertDefaultShape(altNode, node);
            convertIntoAltText(altNode, node);
            return altNode;
        }
        else if (node.type === "VECTOR") {
            const altNode = new AltRectangleNode();
            altNode.id = node.id;
            altNode.name = node.name;
            if (altParent) {
                altNode.parent = altParent;
            }
            convertDefaultShape(altNode, node);
            // Vector support is still missing. Meanwhile, add placeholder.
            altNode.cornerRadius = 8;
            if (altNode.fills === figma.mixed || altNode.fills.length === 0) {
                // Use rose[400] from Tailwind 2 when Vector has no color.
                altNode.fills = [
                    {
                        type: "SOLID",
                        color: {
                            r: 0.5,
                            g: 0.23,
                            b: 0.27,
                        },
                        visible: true,
                        opacity: 0.5,
                        blendMode: "NORMAL",
                    },
                ];
            }
            return altNode;
        }
        return null;
    });
    return mapped.filter(notEmpty);
};
const iconToRectangle = (node, altParent) => {
    if (node.children.every((d) => d.type === "VECTOR")) {
        const altNode = new AltRectangleNode();
        altNode.id = node.id;
        altNode.name = node.name;
        if (altParent) {
            altNode.parent = altParent;
        }
        convertBlend(altNode, node);
        // width, x, y
        convertLayout(altNode, node);
        // Vector support is still missing. Meanwhile, add placeholder.
        altNode.cornerRadius = 8;
        altNode.strokes = [];
        altNode.strokeWeight = 0;
        altNode.strokeMiterLimit = 0;
        altNode.strokeAlign = "CENTER";
        altNode.strokeCap = "NONE";
        altNode.strokeJoin = "BEVEL";
        altNode.dashPattern = [];
        altNode.fillStyleId = "";
        altNode.strokeStyleId = "";
        altNode.fills = [
            {
                type: "IMAGE",
                imageHash: "",
                scaleMode: "FIT",
                visible: true,
                opacity: 0.5,
                blendMode: "NORMAL",
            },
        ];
        return altNode;
    }
    return null;
};
const convertLayout = (altNode, node) => {
    // Get the correct X/Y position when rotation is applied.
    // This won't guarantee a perfect position, since we would still
    // need to calculate the offset based on node width/height to compensate,
    // which we are not currently doing. However, this is a lot better than nothing and will help LineNode.
    if (node.rotation !== undefined && Math.round(node.rotation) !== 0) {
        const boundingRect = getBoundingRect(node);
        altNode.x = boundingRect.x;
        altNode.y = boundingRect.y;
    }
    else {
        altNode.x = node.x;
        altNode.y = node.y;
    }
    altNode.width = node.width;
    altNode.height = node.height;
    altNode.rotation = node.rotation;
    altNode.layoutAlign = node.layoutAlign;
    altNode.layoutGrow = node.layoutGrow;
};
const convertFrame = (altNode, node) => {
    altNode.layoutMode = node.layoutMode;
    altNode.primaryAxisSizingMode = node.primaryAxisSizingMode;
    altNode.counterAxisSizingMode = node.counterAxisSizingMode;
    // Fix this: https://stackoverflow.com/questions/57859754/flexbox-space-between-but-center-if-one-element
    // It affects HTML, Tailwind, Flutter and possibly SwiftUI. So, let's be consistent.
    if (node.primaryAxisAlignItems === "SPACE_BETWEEN" &&
        node.children.length === 1) {
        altNode.primaryAxisAlignItems = "CENTER";
    }
    else {
        altNode.primaryAxisAlignItems = node.primaryAxisAlignItems;
    }
    //   altNode.counterAxisAlignItems = node.counterAxisAlignItems;
    altNode.paddingLeft = node.paddingLeft;
    altNode.paddingRight = node.paddingRight;
    altNode.paddingTop = node.paddingTop;
    altNode.paddingBottom = node.paddingBottom;
    altNode.itemSpacing = node.itemSpacing;
    altNode.layoutGrids = node.layoutGrids;
    altNode.gridStyleId = node.gridStyleId;
    altNode.clipsContent = node.clipsContent;
    altNode.guides = node.guides;
};
const convertGeometry = (altNode, node) => {
    altNode.fills = node.fills;
    altNode.strokes = node.strokes;
    altNode.strokeWeight = node.strokeWeight;
    altNode.strokeMiterLimit = node.strokeMiterLimit;
    altNode.strokeAlign = node.strokeAlign;
    altNode.strokeCap = node.strokeCap;
    altNode.strokeJoin = node.strokeJoin;
    altNode.dashPattern = node.dashPattern;
    altNode.fillStyleId = node.fillStyleId;
    altNode.strokeStyleId = node.strokeStyleId;
};
const convertBlend = (altNode, node) => {
    altNode.opacity = node.opacity;
    altNode.blendMode = node.blendMode;
    altNode.isMask = node.isMask;
    altNode.effects = node.effects;
    altNode.effectStyleId = node.effectStyleId;
    altNode.visible = node.visible;
};
const convertDefaultShape = (altNode, node) => {
    // opacity, visible
    convertBlend(altNode, node);
    // fills, strokes
    convertGeometry(altNode, node);
    // width, x, y
    convertLayout(altNode, node);
};
const convertCorner = (altNode, node) => {
    altNode.cornerRadius = node.cornerRadius;
    altNode.cornerSmoothing = node.cornerSmoothing;
};
const convertRectangleCorner = (altNode, node) => {
    altNode.topLeftRadius = node.topLeftRadius;
    altNode.topRightRadius = node.topRightRadius;
    altNode.bottomLeftRadius = node.bottomLeftRadius;
    altNode.bottomRightRadius = node.bottomRightRadius;
};
const convertIntoAltText = (altNode, node) => {
    altNode.textAlignHorizontal = node.textAlignHorizontal;
    altNode.textAlignVertical = node.textAlignVertical;
    altNode.paragraphIndent = node.paragraphIndent;
    altNode.paragraphSpacing = node.paragraphSpacing;
    altNode.fontSize = node.fontSize;
    altNode.fontName = node.fontName;
    altNode.textCase = node.textCase;
    altNode.textDecoration = node.textDecoration;
    altNode.letterSpacing = node.letterSpacing;
    //   altNode.textAutoResize = node.textAutoResize;
    altNode.characters = node.characters;
    altNode.lineHeight = node.lineHeight;
};
export function notEmpty(value) {
    return value !== null && value !== undefined;
}
const applyMatrixToPoint = (matrix, point) => {
    return [
        point[0] * matrix[0][0] + point[1] * matrix[0][1] + matrix[0][2],
        point[0] * matrix[1][0] + point[1] * matrix[1][1] + matrix[1][2],
    ];
};
/**
 *  this function return a bounding rect for an nodes
 */
// x/y absolute coordinates
// height/width
// x2/y2 bottom right coordinates
export const getBoundingRect = (node) => {
    const boundingRect = {
        x: 0,
        y: 0,
        // x2: 0,
        // y2: 0,
        // height: 0,
        // width: 0,
    };
    const halfHeight = node.height / 2;
    const halfWidth = node.width / 2;
    const [[c0, s0, x], [s1, c1, y]] = node.absoluteTransform;
    const matrix = [
        [c0, s0, x + halfWidth * c0 + halfHeight * s0],
        [s1, c1, y + halfWidth * s1 + halfHeight * c1],
    ];
    // the coordinates of the corners of the rectangle
    const XY = {
        x: [1, -1, 1, -1],
        y: [1, -1, -1, 1],
    };
    // fill in
    for (let i = 0; i <= 3; i++) {
        const a = applyMatrixToPoint(matrix, [
            XY.x[i] * halfWidth,
            XY.y[i] * halfHeight,
        ]);
        XY.x[i] = a[0];
        XY.y[i] = a[1];
    }
    XY.x.sort((a, b) => a - b);
    XY.y.sort((a, b) => a - b);
    return {
        x: XY.x[0],
        y: XY.y[0],
    };
    return boundingRect;
};
