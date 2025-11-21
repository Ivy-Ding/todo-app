// object ----------------------------------------------
class Subtask {
	constructor(title, dateCreated = Date.now(), dateCompleted = null) {
		this.title = title;
		this.dateCreated = dateCreated;
		// dateCreate: used to order subtasks -- we aren't allowing drag and drop so it should be fine like this for now
		this.dateCompleted = dateCompleted;
	}
}

class Task {
	constructor(
		title, // mandatory string
		category = null, // string in categories list
		dueDate = null, // yyyy-mm-dd date object
		priority = PRIORITIES.none, // int, 0=none, 3=high
		notes = '', // string
		subtasks = [], // array of Subtask
		dateCreated = Date.now(), // use as ID
		dateCompleted = null, // use as completion status, not null = complete
		dateDeleted = null // use for undoing deletion in archive tab
	) {
		this.title = title;
		this.category = category;
		this.dueDate = dueDate;
		this.priority = priority;
		this.notes = notes;
		this.subtasks = subtasks;
		this.dateCreated = dateCreated;
		this.dateCompleted = dateCompleted;
		this.dateDeleted = dateDeleted;
	}
}

// DOM consts & handlers --------------------------------------------
// PANES FOR TAB SWITCHING
const archiveButton = document.getElementById('archive-button');
const archivePage = document.getElementById('archive-page');
archiveButton.addEventListener('click', (e) => {
	setActivePage(PAGES.archive);
});

const settingsButton = document.getElementById('settings-button');
const settingsPage = document.getElementById('settings-page');
settingsButton.addEventListener('click', (e) => {
	setActivePage(PAGES.settings);
});

const themesDiv = document.getElementById('themes');

themesDiv.addEventListener('click', (e) => {
    let targetDiv = e.target.closest('.theme');
    if (targetDiv) {
        applyTheme(targetDiv.id);
    }
});

const taskButton = document.getElementById('tasks-button');
taskButton.addEventListener('click', (e) => {
	setActivePage(PAGES.home);
});
const tasksPage = document.getElementById('tasks-page');
const tasksListPane = document.getElementById('tasks-list-pane');
const taskDetailsPane = document.getElementById('task-details-pane');
const homeSidePane = document.getElementById('home-side-pane');

// TASK LIST PAGE
const taskListContainer = document.getElementById('task-list-container');
const newTaskForm = document.getElementById('new-task-form');
const taskDetailForm = document.getElementById('task-details-form');
const deleteTaskButton = document.getElementById('delete-task');
const closeDetailsButton = document.getElementById('close-details');
const categorySelect = document.getElementById('category');

newTaskForm.addEventListener('submit', handleAddTaskOnClick);
taskDetailForm.addEventListener('submit', handleEditTaskSaveOnClick);

// POPUP MODAL
const popupOverlay = document.getElementById('popup-overlay');
const popupInput = document.getElementById('popup-input');
const popupTitle = document.getElementById('popup-title');
const popupSave = document.getElementById('popup-save');
const popupClose = document.getElementById('popup-close');

// Add these variables to your script.js
const THEMES = {
	'theme-1': {
		primary: '#ff9f1a', // Orange (Default)
		high: '#c62828',
		medium: '#d9812e',
		low: '#258725',
	},
	'theme-2': {
		primary: '#43a047', // Green
		high: '#c62828',
		medium: '#fb8c00',
		low: '#1b5e20',
	},
	'theme-3': {
		primary: '#1e88e5', // Blue
		high: '#e53935',
		medium: '#ffb300',
		low: '#388e3c',
	},
	'theme-4': {
		primary: '#cd12a8ff', // Purple
		high: '#c62828',
		medium: '#ff8f00',
		low: '#558b2f',
	},
	'theme-color-blind': {
		primary: '#000000',
		high: '#ec0258',
		medium: '#FB9A08',
		low: '#025dad',
	},
	'theme-monochrome': {
		primary: '#202020',
		high: '#202020',
		medium: '#202020',
		low: '#202020',
	},
};

popupSave.addEventListener('click', () => {
	if (popupSaveCallback) popupSaveCallback(popupInput.value);
	savePopup();
});

popupClose.addEventListener('click', closePopup);

categorySelect.addEventListener('click', function () {
	if (this.value === 'add-new') {
		openPopup('Add New Category', '', (newCat) => {
			newCat = newCat.trim();
			if (newCat !== '') {
				handleAddNewCategoryOnClick(newCat);
			}
		});
	}
});

const newSubtaskInput = document.getElementById('new-subtask-input');
const newSubtaskButton = document.getElementById('new-subtask-button');
const subtaskListUI = document.getElementById('subtask-list');

newSubtaskButton.addEventListener('click', function (e) {
	e.preventDefault();

	if (!taskBeingEdited) {
		alert('Select a task to add subtasks to.');
		return;
	}

	const title = newSubtaskInput.value.trim();
	if (title === '') {
		console.log('empty subtask');
		newSubtaskInput.setCustomValidity('subtask title cannot be empty');
		newSubtaskInput.reportValidity();
		return;
	}

	const sub = new Subtask(title);
	taskBeingEdited.subtasks.push(sub);

	renderSubtask(sub);

	newSubtaskInput.value = '';
});

closeDetailsButton.addEventListener('click', (e) => {
	// Switch back to Home page
	setActivePage(PAGES.home);

	// Clear everything
	clearTaskDetailsPanel();

	// Exit editing mode
	taskBeingEdited = null;
});

// Delete Popup Modal
const deletePopupOverlay = document.getElementById('delete-popup-overlay');
const deletePopupMessage = document.getElementById('delete-popup-message');
const deletePopupCancel = document.getElementById('delete-popup-cancel');
const deletePopupConfirm = document.getElementById('delete-popup-confirm');

deletePopupCancel.addEventListener('click', closeDeletePopup);

deletePopupConfirm.addEventListener('click', () => {
	if (deleteCallback) deleteCallback();
	closeDeletePopup();
});

deleteTaskButton.addEventListener('click', (e) => {
	e.preventDefault();

	if (!taskBeingEdited) return;

	const task = taskBeingEdited;

	openDeletePopup(task, () => {
		task.dateDeleted = Date.now();

		refreshTaskListPane();

		clearTaskDetailsPanel();
		taskBeingEdited = null;

		setActivePage(PAGES.home);
	});
});

// Priority active state styling
document.querySelectorAll('.form-group input[type="radio"]').forEach((radio) => {
	radio.addEventListener('change', () => {
		document.querySelectorAll('.form-group label').forEach((label) => {
			label.classList.remove('active');
		});
		radio.parentElement.classList.add('active');
	});
});

// variables ---------------------------------------------
const PRIORITIES = {
	none: 0,
	low: 1,
	medium: 2,
	high: 3,
};

let taskList = [new Task('sample task')];
let categoriesList = [];

let taskBeingEdited = null;

let popupSaveCallback = null;

let deleteCallback = null;

const PAGES = {
	home: 'home',
	details: 'details',
	archive: 'archive',
	settings: 'settings',
};

// REWARD SYSTEM VARIABLES
const TASKS_PER_GROWTH_STAGE = 3;
let tasksToNextGrowth = TASKS_PER_GROWTH_STAGE;
let currentTreeStage = 0; // Tracks how many trees have been grown (optional)

// DOM ELEMENTS for Rewards
const rewardsContainer = document.getElementById('rewards-container');
const dropletsContainer = document.getElementById('droplets-container');

// helper methods --------------------

// compare functions (todo: add more by priority & due date)
function compareByCreationTime(taskA, taskB) {
	return taskA.dateCreated - taskB.dateCreated;
}

// simple filter condition for determing if a task is active (!active = marked as complete)
function isActive(task) {
	return !task.dateCompleted && !task.dateDeleted;
}

// render task to a list item with children: checkbox, span title, edit button
function renderTaskToLi(task) {
	console.trace('Rendering task to item...');
	console.trace(task);

	let li = document.createElement('li');
	li.setAttribute('id', task.dateCreated);

	const text = document.createElement('span');
	text.textContent = task.title;

	const checkbox = document.createElement('input');
	checkbox.setAttribute('type', 'checkbox');
	checkbox.addEventListener('change', function () {
		if (this.checked) {
			task.dateCompleted = Date.now();

			this.disabled = true;
			editButton.disabled = true;
			setTimeout(() => {
				// Remove from active list visually
				li.parentNode.removeChild(li);

				// If user was editing same task: close details
				if (taskBeingEdited === task) {
					clearTaskDetailsPanel();
					taskBeingEdited = null;
				}
				handleTaskCompletedForReward();

				// Move into archive completed
				refreshArchiveCompletedPane();
			}, 1000);
		}
	});

	const editButton = document.createElement('button');
	// editButton.style.padding = '10px 20px';
	editButton.style.height = '22px';
	editButton.innerHTML =
		'<img src=Logo/pencil.png width=16 height=16 margin-right=5px>      Edit';
	editButton.addEventListener('click', () => handleEditOnClick(task));

	li.appendChild(checkbox);
	li.appendChild(text);
	li.appendChild(editButton);

	return li;
}

// render given list of tasks to a HTML unordered list
function renderTaskListToUL(listToRender) {
	console.trace('Rendering given task list to unordered list...');
	console.trace(listToRender);

	let ul = document.createElement('ul');
	for (const task of listToRender) {
		ul.appendChild(renderTaskToLi(task));
	}

	return ul;
}

// refresh task list pane to reflect changes (i.e. added/sorted/filtered task)
// I envision the filter/sort to be callback functions but whatever works
function refreshTaskListPane(filter = null, sort = null) {
	console.debug('Refreshing task list pane...');

	let htmlToDisplay = renderTaskListToUL(taskList.filter(isActive));

	// todo: add support logic for filter & sort, as the above simply shows all incomplete tasks
	if (filter) {
	}

	if (sort) {
	}

	taskListContainer.replaceChildren(htmlToDisplay);
}

function refreshArchiveCompletedPane() {
	const completedList = document.getElementById('completed-tasks-list');

	// Clear before re-rendering
	completedList.innerHTML = '';

	// Only tasks that have a non-null/non-undefined dateCompleted AND are not deleted
	taskList
		.filter((t) => t.dateCompleted != null && !t.dateDeleted)
		.sort(compareByCreationTime)
		.forEach((task) => {
			const li = document.createElement('li');
			li.id = task.dateCreated;

			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.checked = true;

			// Unchecking in archive → move back to active
			checkbox.addEventListener('change', function () {
				if (!this.checked) {
					task.dateCompleted = null; // no completed date anymore
					refreshTaskListPane();
					refreshArchiveCompletedPane();
				}
			});

			const title = document.createElement('span');
			title.textContent = task.title;

			// Only show date if the task object actually has a valid dateCompleted
			const dateSpan = document.createElement('span');
			let dateText = '';

			if (task.dateCompleted != null) {
				const d = new Date(task.dateCompleted);
				if (!isNaN(d.getTime())) {
					dateText = d.toLocaleDateString();
				}
			}

			// Only append date if we actually got a valid one
			if (dateText !== '') {
				dateSpan.textContent = dateText;
				li.appendChild(checkbox);
				li.appendChild(title);
				li.appendChild(dateSpan);
			} else {
				li.appendChild(checkbox);
				li.appendChild(title);
			}

			const delBtn = document.createElement('button');
			delBtn.textContent = 'Delete';

			// Clicking this button shows a "Not functional" popup
			delBtn.addEventListener('click', () => {
				openInfoPopup('This feature is not functional right now.');
			});

			li.appendChild(delBtn);

			completedList.appendChild(li);
		});
}

function refreshArchiveDeletedPane() {
	const deletedList = document.getElementById('recently-deleted-list');

	// Clear UI
	deletedList.innerHTML = '';

	taskList
		.filter((t) => t.dateDeleted != null) // only deleted tasks
		.sort(compareByCreationTime)
		.forEach((task) => {
			const li = document.createElement('li');
			li.id = task.dateCreated;

			// checkbox (just a selector, does not change state)
			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';

			// title
			const title = document.createElement('span');
			title.textContent = task.title;

			// undelete button
			const btn = document.createElement('button');
			btn.textContent = 'Undelete';

			btn.addEventListener('click', () => {
				task.dateDeleted = null;

				// checkbox state decides where the task goes
				if (checkbox.checked) {
					// move to completed
					task.dateCompleted = Date.now();
					refreshArchiveCompletedPane();
				} else {
					// move to active
					task.dateCompleted = null;
					refreshTaskListPane();
				}

				refreshArchiveDeletedPane(); // always remove from deleted list
			});

			li.appendChild(checkbox);
			li.appendChild(title);
			li.appendChild(btn);

			deletedList.appendChild(li);
		});
}

// TASK LIST PAGE event handler methods ------------------------------------------------

// create a new task and reset the input box to blank
function handleAddTaskOnClick(e) {
	e.preventDefault();
	title = e.target.elements['title'].value;

	console.debug(`addTask(${title})...`);

	// create new task
	const newTask = new Task(title);
	taskList.push(newTask);
	console.trace(taskList);

	// reset task input form
	newTaskForm.reset();

	// update list
	refreshTaskListPane();
}

// push category name to categoriesList, then update the category DOM drodown
// note: new category name cannot be "add-new", if it is then prompt user to rename and do not add to list
function handleAddNewCategoryOnClick(categoryName) {
	categoryName = categoryName.trim();

	// empty name check
	if (categoryName.length === 0) {
		alert('Category name cannot be empty.');
		return;
	}

	// name cannot be "add-new" check
	if (categoryName === 'add-new' || categoryName === '+ Add New Category') {
		alert('Please choose a different category name.');
		return;
	}

	// prevent duplicates
	if (categoriesList.includes(categoryName)) {
		alert('Category already exists.');
		return;
	}

	categoriesList.push(categoryName);

	const opt = document.createElement('option');
	opt.value = categoryName;
	opt.textContent = categoryName;

	categorySelect.appendChild(opt);

	categorySelect.value = categoryName;
}

// pre-fill the task details form with info from the given task,
// then set the task details form to show (ignore this for now as we aren't switching panes yet, so task details form is always showing lol)
function handleEditOnClick(task) {
	console.debug(`handleEditOnClick(${task.title})`);

	// swap tabs
	setActivePage(PAGES.details);

	// task being edited
	taskBeingEdited = task;

	// fill form fields
	taskDetailForm.elements['title'].value = task.title || '';
	taskDetailForm.elements['category'].value = task.category || 'default';
	taskDetailForm.elements['due-date'].value = task.dueDate || '';
	taskDetailForm.elements['notes'].value = task.notes || '';

	// priority radio buttons fill
	const radios = taskDetailForm.querySelectorAll('input[name="priority"]');

	// if no priority exists use none
	const priorityValue = task.priority != null ? Number(task.priority) : 0;

	radios.forEach((r) => {
		r.checked = Number(r.value) === priorityValue;
	});

	// Update active visual state
	document
		.querySelectorAll('.form-group label')
		.forEach((label) => label.classList.remove('active'));
	const checkedRadio = taskDetailForm.querySelector(
		'input[name="priority"]:checked'
	);
	if (checkedRadio) checkedRadio.parentElement.classList.add('active');

	subtaskListUI.querySelectorAll('li:not(:last-child)').forEach((li) => li.remove());

	// Render existing subtasks
	task.subtasks.forEach((st) => renderSubtask(st));
}

// on submit update the task info and refresh the task list pane
function handleEditTaskSaveOnClick(e) {
	e.preventDefault();

	if (!taskBeingEdited) return;

	console.debug(`Saving task: ${taskBeingEdited.title}`);

	// Update the basic fields
	taskBeingEdited.title = taskDetailForm.elements['title'].value.trim();
	taskBeingEdited.category = taskDetailForm.elements['category'].value;
	taskBeingEdited.dueDate = taskDetailForm.elements['due-date'].value;
	taskBeingEdited.notes = taskDetailForm.elements['notes'].value.trim();

	// Update PRIORITY
	const selectedPriority = taskDetailForm.querySelector(
		'input[name="priority"]:checked'
	);
	taskBeingEdited.priority = selectedPriority ? Number(selectedPriority.value) : 0;

	// Refresh list UI
	refreshTaskListPane();

	console.debug('Task saved:', taskBeingEdited);

	// Switch back to home page
	setActivePage(PAGES.home);

	clearTaskDetailsPanel();

	// Stop editing mode
	taskBeingEdited = null;
}

// delete the task from task list, this is undoable in archive tab
function handleDeleteTaskOnClick(task) {
	task.dateDeleted = Date.now();
}

// show the filter dropdown then filter tasks and refresh task list pane
function handleFilterOnClick() {}

// show the sort dropdown then sort tasks and refresh task list pane
function handleSortOnClick() {}

// POPUP MODAL event handler methods ------------------------------------------------
function openPopup(title, defaultValue, onSave) {
	popupTitle.textContent = title;
	popupInput.value = defaultValue || '';
	popupSaveCallback = onSave;
	popupOverlay.style.display = 'flex';
	popupInput.focus();
}

function closePopup() {
	popupOverlay.style.display = 'none';
	popupSaveCallback = null;

	categorySelect.value = 'default';
}

function savePopup() {
	popupOverlay.style.display = 'none';
	popupSaveCallback = null;
}

function renderSubtask(subtask) {
	const li = document.createElement('li');

	const checkbox = document.createElement('input');
	checkbox.type = 'checkbox';

	// Restore checkbox state if subtask was already completed
	if (subtask.dateCompleted !== null) {
		checkbox.checked = true;
	}

	checkbox.addEventListener('change', function () {
		if (this.checked) {
			// set if it wasn't completed before
			if (subtask.dateCompleted === null) {
				subtask.dateCompleted = Date.now();
			}
		} else {
			subtask.dateCompleted = null; // unmark
		}
	});

	const span = document.createElement('span');
	span.textContent = subtask.title;

	li.appendChild(checkbox);
	li.appendChild(span);

	// Insert before the last row (the input field)
	const lastRow = subtaskListUI.lastElementChild;
	subtaskListUI.insertBefore(li, lastRow);
}

function clearTaskDetailsPanel() {
	// Clear main form
	taskDetailForm.reset();

	// Reset category dropdown
	taskDetailForm.elements['category'].value = 'default';

	// Reset priority None
	const nonePriority = taskDetailForm.querySelector(
		'input[name="priority"][value="0"]'
	);
	if (nonePriority) nonePriority.checked = true;

	// Clear all subtasks except input row
	const subtaskItems = subtaskListUI.querySelectorAll('li:not(:last-child)');
	subtaskItems.forEach((li) => li.remove());
}

// Tab Switch ---------------------------------------------------------------
function hideElement(element) {
	element.style.display = 'none';
}

function showElement(element) {
	// note: currently all pages & divs are flex and not blocks,
	// if future updates change this, this code needs to be updated as well
	element.style.display = 'flex';
}

// input: a page from const PAGES
// function: show and hide the corresponding pages and panes
function setActivePage(newPage) {
	console.debug(`renderActivePage(${newPage})`);
	switch (newPage) {
		case PAGES.home:
			// update buttons
			taskButton.classList.add('active');
			archiveButton.classList.remove('active');
			settingsButton.classList.remove('active');
			// show & hide pages
			showElement(tasksPage);
			hideElement(archivePage);
			hideElement(settingsPage);
			// show & hide panes
			showElement(tasksListPane);
			showElement(homeSidePane);
			hideElement(taskDetailsPane);
			break;
		case PAGES.details:
			// update buttons
			taskButton.classList.add('active');
			archiveButton.classList.remove('active');
			settingsButton.classList.remove('active');
			// show & hide pages
			showElement(tasksPage);
			hideElement(archivePage);
			hideElement(settingsPage);
			// show & hide panes
			showElement(tasksListPane);
			showElement(taskDetailsPane);
			hideElement(homeSidePane);
			break;
		case PAGES.archive:
			// update buttons
			archiveButton.classList.add('active');
			taskButton.classList.remove('active');
			settingsButton.classList.remove('active');
			// show & hide pages
			showElement(archivePage);
			hideElement(tasksPage);
			hideElement(settingsPage);

			refreshArchiveDeletedPane();
			refreshArchiveCompletedPane();
			break;
		case PAGES.settings:
			// update buttons
			settingsButton.classList.add('active');
			taskButton.classList.remove('active');
			archiveButton.classList.remove('active');
			// show & hide pages
			showElement(settingsPage);
			hideElement(archivePage);
			hideElement(tasksPage);
			break;
		default:
			console.error(`Unknown page encountered: ${newPage}`);
	}
}

function openDeletePopup(task, callback) {
	deletePopupMessage.textContent = `Are you sure you want to delete "${task.title}"?`;
	deleteCallback = callback;
	deletePopupOverlay.style.display = 'flex';
}

function closeDeletePopup() {
	deletePopupOverlay.style.display = 'none';
	deleteCallback = null;
}

function openInfoPopup(message) {
	popupTitle.textContent = message;

	popupInput.style.display = 'none'; // hide input
	popupSave.style.display = 'none'; // hide save button
	popupClose.textContent = 'OK';

	popupOverlay.style.display = 'flex';

	popupClose.onclick = () => {
		popupOverlay.style.display = 'none';

		// reset popup layout
		popupInput.style.display = '';
		popupSave.style.display = '';
		popupClose.textContent = 'Close';
	};
}

// Initial Setup
function initializeRewardsUI() {
	// Create and render the initial droplets (3 required)
	dropletsContainer.innerHTML = '';
	for (let i = 0; i < TASKS_PER_GROWTH_STAGE; i++) {
		const droplet = document.createElement('div');
		droplet.classList.add('droplet');
		dropletsContainer.appendChild(droplet);
	}
}

// Call on startup
document.addEventListener('DOMContentLoaded', initializeRewardsUI);

// REWARD SYSTEM HANDLER
function handleTaskCompletedForReward() {
	tasksToNextGrowth--;

	// 1. Animate Droplet Removal
	const dropletElements = dropletsContainer.querySelectorAll('.droplet');
	// Find the first non-used droplet and mark it as used
	for (let i = 0; i < TASKS_PER_GROWTH_STAGE; i++) {
		const droplet = dropletElements[i];
		if (!droplet.classList.contains('used')) {
			droplet.classList.add('used');
			break;
		}
	}

	// 2. Check for Tree Growth
	if (tasksToNextGrowth <= 0) {
		// Tree Growth Animation
		const treeImage = document.getElementById('tree-image');
		currentTreeStage++;
		// Apply a slight scale transform to simulate growth (using CSS transition)
		treeImage.style.transform = `scale(${1 + currentTreeStage * 0.1})`;

		// Show success popup!
		openInfoPopup(`HURRRAY! You grew a tree! You are now at stage ${currentTreeStage}!`);

		// Reset for next stage
		tasksToNextGrowth = TASKS_PER_GROWTH_STAGE;
		dropletElements.forEach((d) => d.classList.remove('used'));
	}
}

// Function to apply a selected theme
function applyTheme(themeName) {
    const theme = THEMES[themeName];
    if (!theme) return;

    // Get the :root element style sheet
    const root = document.documentElement.style;

    // 1. FIX: Remove 'selected' class from ALL theme boxes
    document.querySelectorAll('.theme').forEach(div => {
        div.classList.remove('selected');
    });

    // 2. Apply main colors (unchanged)
    root.setProperty('--primary-color', theme.primary);
    root.setProperty('--border-color', theme.primary); // Border usually matches primary

    // 3. Apply priority colors (unchanged)
    root.setProperty('--high-priority-color', theme.high);
    root.setProperty('--medium-priority-color', theme.medium);
    root.setProperty('--low-priority-color', theme.low);
    
    // 4. Apply 'selected' class to the CURRENT theme box
    document.getElementById(themeName).classList.add('selected');
}

function main() {
	applyTheme('theme-1');
	setActivePage(PAGES.home);
	refreshTaskListPane();
	refreshArchiveCompletedPane();
	refreshArchiveDeletedPane();
}

main();