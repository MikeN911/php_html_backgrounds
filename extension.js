// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */



function activate(context) {
	
	context.subscriptions.push(vscode.window.onDidChangeWindowState( function(e) {
		setBackground();
	}));
	context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection( function(e) {
		setBackground();
	}));
	
}






// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}



var scoperRangeDecorationType = setRangeStyle();
var scoperEndDecorationType = setEndStyle();
var scoper_bracket = setBracketEndStyle();




function findPHP() {
	
	const range_decoration = [];
	
	
	const editor = vscode.window.activeTextEditor;
	
	const text = editor.document.getText();
	
	const length = text.length;

	const opening_bracket = ['?>'];
	const closing_bracket = ['<?php', '<?=', '<?'];
	
	var exist_php = false;
	for ( let j = 0; j < opening_bracket.length; j++ ) {
		if (text.includes(opening_bracket[j])) {
			exist_php = true;
			break;
		}
	}
	if (!exist_php) {
		for ( let j = 0; j < closing_bracket.length; j++ ) {
			if (text.includes(closing_bracket[j])) {
				exist_php = true;
				break;
			}
		}
	}
	
	if (!exist_php) {
		range_decoration.push([0, length, true]);
		return range_decoration;
	}
	
	
	let blocks = [];
	let start = 0;
	let end = 0;
	let row_index = 0;
	let possiton = 0;
	for (let i = 0; i < text.length; i++) {
		
		if (text[i] === '\n') {
			row_index = i;
		}
		
		if (text.substr( i, '<?php'.length) === '<?php' ||  text.substr( i, '<?='.length) === '<?=' || text.substr( i, '<?'.length) === '<?') {
			
			if (i == 0) break;
			
			blocks.push([start, row_index, true]);
			blocks.push([row_index + 1, i, false]);
			possiton = i + 1;
			break;
		}
	}
	
	var start_row_index = 0;
	for (let i = possiton; i < text.length; i++) {
		
		if (text[i] === '\n') {
			row_index = i;
			
			if (start && !start_row_index) {
				start_row_index = row_index;
			}
		}
		
		
		if (text.substr( i, '?>'.length) === '?>') {
			start = i + 2;
			start_row_index = 0
		} else if (text.substr( i, '<?php'.length) === '<?php' ||  text.substr( i, '<?='.length) === '<?=' || text.substr( i, '<?'.length) === '<?') {
			
			if (start && start <= start_row_index) {
				blocks.push([start, start_row_index, false]);
				start = start_row_index + 1;
				start_row_index = 0
			}
			
			if (start && start <= row_index) {
				blocks.push([start, row_index, true]);
				start = row_index + 1;
			}
			
			end = i;
			blocks.push([start, end, false]);
			start = 0;
		}
		
	}
	
	if (start !== text.length && start > end) {
		if (start <= start_row_index) {
			blocks.push([start, start_row_index, false]);
			start = start_row_index + 1;
		}
		
		blocks.push([start, text.length, true]);
	}
	
	return blocks;
}

function findPHPEnd() {
	
	const blocks = [];
	
	const editor = vscode.window.activeTextEditor;
	
	const text = editor.document.getText();
	
	const bracket = ['?>', '<?php', '<?=', '<?'];
	
	for (let i = 0; i < text.length; i++) {
		for (let j = 0; j < bracket.length; j++) {
			if (text.substr(i, bracket[j].length) === bracket[j]) {
				blocks.push([i, i + bracket[j].length]);
				i += bracket[j].length;
				break;
			}
		}
	}
	
	return blocks;
}


function setBackground() {
	
	const editor = vscode.window.activeTextEditor;
	if ( !editor ) {
		return;
	}
	
	if (editor.document.languageId != 'php') return;
	
	if ( vscode.window.activeTextEditor ) {
		vscode.window.activeTextEditor.setDecorations( scoperRangeDecorationType, [] );
		vscode.window.activeTextEditor.setDecorations( scoperEndDecorationType, [] );
		vscode.window.activeTextEditor.setDecorations( scoper_bracket, [] );
	}
	scoperRangeDecorationType.dispose();
	scoperEndDecorationType.dispose();
	scoper_bracket.dispose();
	
	
	scoperRangeDecorationType = setRangeStyle();
	scoperEndDecorationType = setEndStyle()
	scoper_bracket = setBracketEndStyle();
	
	var range_decorations = [];
	var start_decorations = [];
	
	let pole = findPHP();
	for( var i = 0; i < pole.length; i++ ) {
		
		let start = pole[i][0];
		let end = pole[i][1];
		if (pole[i][2]) {
			const range_decoration = new vscode.Range( editor.document.positionAt( start ), editor.document.positionAt( end ) );
			range_decorations.push( range_decoration );
		} else {
			const start_decoration = new vscode.Range( editor.document.positionAt( start ), editor.document.positionAt( end) );
			start_decorations.push( start_decoration );
		}
	}
	
	editor.setDecorations(scoperRangeDecorationType, range_decorations );
	editor.setDecorations(scoperEndDecorationType, start_decorations );
	
	
	var bracket_decorations = [];
	
	let pole2 = findPHPEnd();
	for( var i = 0; i < pole2.length; i++ ) {
		
		let start = pole2[i][0];
		let end = pole2[i][1];
		
		const bracket_decoration = new vscode.Range( editor.document.positionAt( start ), editor.document.positionAt( end ) );
		bracket_decorations.push( bracket_decoration );
	}
	
	editor.setDecorations(scoper_bracket, bracket_decorations );
}

function setRangeStyle()
{
	return vscode.window.createTextEditorDecorationType( {
		
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		light: {
			backgroundColor: vscode.workspace.getConfiguration( 'phphtmlbackground' ).html_background,
		},
		dark: {
			backgroundColor: vscode.workspace.getConfiguration( 'phphtmlbackground' ).html_background
		},
		isWholeLine: vscode.workspace.getConfiguration( 'phphtmlbackground' ).html_background

	} );
}

function setEndStyle()
{
	return vscode.window.createTextEditorDecorationType( {
		light: {
			backgroundColor: vscode.workspace.getConfiguration( 'phphtmlbackground' ).html_background,
		},
		dark: {
			backgroundColor: vscode.workspace.getConfiguration( 'phphtmlbackground' ).html_background,
		}
	} );
}

function setBracketEndStyle()
{
	return vscode.window.createTextEditorDecorationType( {
		light: {
			color: vscode.workspace.getConfiguration( 'phphtmlbackground' ).php_tags_color,
			fontWeight: 'bolder'
		   
		},
		dark: {
			color: vscode.workspace.getConfiguration( 'phphtmlbackground' ).php_tags_color,
			fontWeight: 'bolder'
		}
	} );
}
