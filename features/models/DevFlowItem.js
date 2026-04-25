// File: features/models/DevFlowItem.js
const vscode = require('vscode');

class DevFlowItem extends vscode.TreeItem {
    constructor(label, iconName, collapsibleState, contextValue, isUser, originalText = null) {
        super(label, collapsibleState);
        this.contextValue = contextValue;
        this.originalText = originalText || label; 
        this.iconPath = new vscode.ThemeIcon(
            iconName, 
            isUser ? new vscode.ThemeColor('gitDecoration.addedResourceForeground') : undefined
        );
    }
}

module.exports = DevFlowItem;