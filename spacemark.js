// JavaScript Document
	function appendLI(name) {
	 	li = document.createElement('li');
		li.innerHTML=name
		list.appendChild(li);
	}
	
	function addWorkspace(name) {
		chrome.bookmarks.getTree(function (array) {
			var root = array[0];
			var others=root.children[1];
			var workspaces = getChild('workspaces', others);
			chrome.bookmarks.create({'parentId': workspaces.id, 'title': name});
			appendWS(name, null);
			switchWorkspaces(name);
		});
	}
	
	function isFolder(node) {
		if (node.url==null) return false;
		else return true;	
	}
	
	function appendWS(name, currWS) {
		var ul = $('<ul>').addClass('black_tie');
		var plus = $('<li>').addClass('ui-icon ui-icon-circle-plus');
		var ws = $('<li>').addClass('ws').html(name);
		var edit = $('<li>').addClass('ui-icon ui-icon-gear');
		var deleteBtn = $('<li>').addClass('ui-icon ui-icon-circle-close');
		
		if (currWS!=null && currWS==name) ul.addClass("currentWS");
		var clear = $('<div>').addClass('clear');
		
		ws.click(function() {switchWorkspaces(name);});
		
		plus.click(function() {
			updateMsg('Clicked Plus');
		});
		
		edit.click(function() {
			updateMsg('Clicked Edit');
		});
		
		deleteBtn.click(function() {
			updateMsg('Clicked Delete');
		});
		
		ul.append(plus).append(ws).append(edit).append(deleteBtn);
		$('#list').append(ul).append(clear);
	}
	
	function appendAllChildren(treeNode) {
			for (child in treeNode.children) {
				appendLI(treeNode.children[child].title);
			}
	}
	
	function getChild(title, treeNode) {
		for (child in treeNode.children) {
			if (treeNode.children[child].title==title) return treeNode.children[child];
		}
		return null;
	}
	
	function moveChildren(sourceNode, destNode) {
		for (child in sourceNode.children) {
			chrome.bookmarks.move(sourceNode.children[child].id, { 'parentId': destNode.id });
		}
	}
	
	function copyChildren(sourceNode, destNode) {
		var children = sourceNode.children;
		for (child in children) {
			childNode = children[child];
			chrome.bookmarks.create({ 'parentId': destNode.id, 'title': childNode.title, 'url': childNode.url }, function(newNode){
				if (childNode.children!=null) {
					copyChildren(childNode, newNode);
				}
			});	
		}
	}
	
	function switchWorkspaces(name) {
		chrome.bookmarks.getTree(function(array) {
			var root = array[0];
			var barNode=root.children[0];
			var others=root.children[1];
			var workspaces = getChild('workspaces', others);	
			var currWS = localStorage.getItem("currentWorkspace");
			var switchWS=false;
			
			if (barNode.children==null || barNode.children.length==0) switchWS = true;
			
			if (!(barNode.children==null || barNode.children.length==0) && (currWS!= name)) {
				if (currWS!=null) {
					var currentNode = getChild(currWS, workspaces);
					moveChildren(barNode, currentNode);
				}
				switchWS=true;
			}
			
			if (switchWS) {
				localStorage.setItem("currentWorkspace", name);
				var ws = getChild(name, workspaces);
				moveChildren(ws, barNode);	
			}
			window.close();
		});
	}
	
	function removeChildren(node) {
		chrome.bookmarks.getChildren(node.id, function(children) {
			for (child in children) {
				chrome.bookmarks.removeTree(children[child].id);	
			}
		});	
	}
	
	function logChildren(node) {
		console.log('Logging children of '+node.title);
		chrome.bookmarks.getChildren(node.id, function(children) {
			for (child in children) {
				console.log(children[child].title);	
			}
		});	
	}
	
	function isUnique(name, spaces) {
		children = spaces.children;
			for (child in children) {
				if (children[child].title==name) return false;	
			}
			return true;
	}
	
	function updateMsg(text) {
		$('#msg').html(text);	
	}
	
	function submitWS() {
		$('#msg').html('');
		name = $('#newText').val();
		chrome.bookmarks.getTree(function(array) {
			var root = array[0];
			var workspaces = getChild('workspaces', root.children[1]);
				
			if (name=="") updateMsg('You must enter a name.');
			else if (!isUnique(name, workspaces)) updateMsg('The Workspace name must be unique.');
			else addWorkspace(name);
		});
		$('#newText').val("");
	}
	
	
	$(function() { 	
		$('#newWorkspaces').click(function() { submitWS(); });
		$('#addWS').submit(function() { submitWS(); });
		
		chrome.bookmarks.getTree(function (array) {
			root = array[0];
			
			bookmarkBar = root.children[0];
			otherBookmarks = root.children[1];
			workspaces = getChild('workspaces', otherBookmarks);
			
			currWS = localStorage.getItem("currentWorkspace");
			
			if (localStorage.getItem("setup")=="complete" && workspaces!=null) { 
				if (workspaces.children!=null) {
					for (node in workspaces.children) {
						appendWS(workspaces.children[node].title, currWS);
					}
				}
			}
			else { 
				// First Time Setup
				localStorage.setItem("setup", "started");
				chrome.bookmarks.create({'parentId': otherBookmarks.id, 'title': 'workspaces'}, function(workspaces) {
					// Create Backup folder and move bookmarks to it.
					chrome.bookmarks.create({'parentId': workspaces.id, 'title': 'BookmarkBar Backup'}, function(backups) {
						appendWS(backups.title, backups.title);
						localStorage.setItem("currentWorkspace", backups.title);
					});				
				});
				localStorage.setItem("setup", "complete");
			}
		});
	});