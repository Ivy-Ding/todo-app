//object ----------------------------------------------
class Subtask {
	constructor(title, dateCreated = Date.now(), dateCompleted = null) {
		this.title = title;
		this.dateCreated = dateCreated;
		//dateCreate: used to order subtasks -- we aren't allowing drag and drop so it should be fine like this for now
		this.dateCompleted = dateCompleted;
	}
}

class Task {
	constructor(
		title, //mandatory string
		category = null, //string in categories list
		dueDate = null, //yyyy-mm-dd date object
		priority = PRIORITIES.none, //int, 0=none, 3=high
		notes = '', //string
		subtasks = [], //array of Subtask
		dateCreated = Date.now(), //use as ID
		dateCompleted = null, //use as completion status, not null = complete
		dateDeleted = null //use for undoing deletion in archive tab
	) {
		this.title = title;
		this.category = category;
		this.dueDate = dueDate;
		this.priority = priority;
		this.notes = notes;
		this.subtasks = subtasks;
		this.dateCreated = dateCreated;
		this.dateCompleted = dateCompleted;
	}
}

//DOM consts & handlers --------------------------------------------
//PANES FOR TAB SWITCHING
const tasksPage = document.getElementById('tasks-page')
const tasksListPane = document.getElementById('tasks-list-pane')
const taskDetailsPane = document.getElementById('task-details-pane')
const taskRewardsPane = document.getElementById('task-rewards-pane')
const taskStatusPane = document.getElementById('task-status-pane')

//TASK LIST PAGE
const taskListContainer = document.getElementById('task-list-container');
const newTaskForm = document.getElementById('new-task-form');
const taskDetailForm = document.getElementById('task-details-form');
const deleteTaskButton = document.getElementById('delete-task');
const closeDetailsButton = document.getElementById('close-details');

newTaskForm.addEventListener('submit', handleAddTaskOnClick);
taskDetailForm.addEventListener('submit', handleEditTaskSaveOnClick);

closeDetailsButton.addEventListener('click', (e) => {
	setActivePage(PAGES.home)
});

//variables---------------------------------------------
const PRIORITIES = {
	none: 0,
	low: 1,
	medium: 2,
	high: 3,
};

let taskList = [new Task("sample task")];
let categoriesList = [];

const PAGES = {
	home: "home",
	details: "details",
	archive: "archive",
	settings: "settings",
};

//helper methods --------------------

//compare functions (todo: add more by priority & due date)
function compareByCreationTime(taskA, taskB) {
	return taskA.dateCreated - taskB.dateCreated;
}

//simple filter condition for determing if a task is active (!active = marked as complete)
function isActive(task) {
	return !task.dateCompleted && !task.dateDeleted;
}

//render task to a list item with children: checkbox, span title, edit button
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
			li.parentNode.removeChild(li);
		}
	});

	const editButton = document.createElement('button');
	editButton.textContent = 'Edit';
	editButton.addEventListener('click', () => handleEditOnClick(task));

	li.appendChild(checkbox);
	li.appendChild(text);
	li.appendChild(editButton);

	return li;
}

//render given list of tasks to a HTML unordered list
function renderTaskListToUL(listToRender) {
	console.trace('Rendering given task list to unordered list...');
	console.trace(listToRender);

	let ul = document.createElement('ul');
	for (const task of listToRender) {
		ul.appendChild(renderTaskToLi(task));
	}

	return ul;
}

//refresh task list pane to reflect changes (i.e. added/sorted/filtered task)
//I envision the filter/sort to be callback functions but whatever works
function refreshTaskListPane(filter = null, sort = null) {
	console.debug('Refreshing task list pane...');

	let htmlToDisplay = renderTaskListToUL(taskList.filter(isActive));

	//todo: add support logic for filter & sort, as the above simply shows all incomplete tasks
	if (filter) {
	}

	if (sort) {
	}

	taskListContainer.replaceChildren(htmlToDisplay);
}

//TASK LIST PAGE event handler methods------------------------------------------------

//create a new task and reset the input box to blank
function handleAddTaskOnClick(e) {
	e.preventDefault();
	title = e.target.elements['title'].value;

	console.debug(`addTask(${title})...`);

	//create new task
	const newTask = new Task(title);
	taskList.push(newTask);
	console.trace(taskList);

	//reset task input form
	newTaskForm.reset();

	//update list
	refreshTaskListPane();
}

// push category name to categoriesList, then update the category DOM drodown
// note: new category name cannot be "add-new", if it is then prompt user to rename and do not add to list
function handleAddNewCategoryOnClick(categoryName) {}

// pre-fill the task details form with info from the given task,
// then set the task details form to show (ignore this for now as we aren't switching panes yet, so task details form is always showing lol)
function handleEditOnClick(task) {
	console.debug(`handleEditOnClick(${task.title})`);
	//swap tabs
	setActivePage(PAGES.details)
	//todo: rest of the edit logic here...
}

// on submit update the task info and refresh the task list pane
function handleEditTaskSaveOnClick(task) {
	console.debug(`handleEditTaskSaveOnClick(${task.title})`);
}

// delete the task from task list, this is undoable in archive tab
function handleDeleteTaskOnClick(task) {
	task.dateDeleted = Date.now();
}

//show the filter dropdown then filter tasks and refresh task list pane
function handleFilterOnClick() {}

//show the sort dropdown then sort tasks and refresh task list pane
function handleSortOnClick() {}

// Tab Switch ---------------------------------------------------------------
function hideElement(element) {
	element.style.display = "none"
}

function showElement(element) {
	//note: currently all pages & divs are flex and not blocks, 
	// if future updates change this, this code needs to be updated as well
	element.style.display = "flex" 
}

//input: a page from const PAGES
//function: show and hide the corresponding pages and panes
function setActivePage(newPage) {
	console.debug(`renderActivePage(${newPage})`)
	switch(newPage) {
		case PAGES.home:
			//show & hide pages
			showElement(tasksPage)
			//todo: hide archive and settings page
			//show & hide panes
			showElement(tasksListPane)
			showElement(taskRewardsPane)
			showElement(taskStatusPane)
			hideElement(taskDetailsPane)
			break;
		case PAGES.details:
			//show & hide pages
			showElement(tasksPage)
			//todo: hide archive and settings page
			//show & hide panes
			showElement(taskDetailsPane)
			showElement(tasksListPane)
			hideElement(taskRewardsPane)
			hideElement(taskStatusPane)
			break;
		case PAGES.archive:
			break;
		case PAGES.settings:
			break;
		default:
			console.error(`Unknown page encountered: ${newPage}`)
	}
}

function main() {
	setActivePage(PAGES.home)
	refreshTaskListPane()
}

main()