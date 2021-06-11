const Signal = (() => {
	let events = {};

	function subscribe(eventName, callback) {
		if(!events.hasOwnProperty(eventName)){
			events[eventName] = [];
			events[eventName].push(callback);
		}
		else {
			events[eventName].push(callback);
		}
	}

	function unsubscribe(eventName, callback) {
		let index = events[eventName].indexOf(callback);
		events[eventName].splice(index, 1);
	}

	function emit(eventName, info) {
		if(events[eventName] !== undefined){
			events[eventName].forEach((callback) => {
				callback(info);
			});
		}
	}

	return { subscribe, unsubscribe, emit };
})();

const GameBoard = (() => {
	let board = [
		[5, 0, 0], 
		[0, 0, 0], 
		[0, 0, 0]
	];

	Signal.subscribe('board-created', createBoard);

	function createBoard(size) {
		board = [];
		for (let i = 0; i < size; i++) {
			board.push([]);
			for (let j = 0; j < size; j++) {
				board[i].push(0);
			}
		}
		return board;
	}

	const getBoard = () => board;
	const updateBoard = (row, col, value) => {
		if(row === board.length && col === board[0].length) {
			board[row][col] = value;
			Signal.emit('updateBoard', {row, col, value});
		}
	};

	return { getBoard, updateBoard, createBoard };
})();

const Player = function(sign) {
	let _sign = sign || '';
	let _turn = false;
	let _name = '';

	function setSign(sign) {
		_sign = sign;
	}

	function getSign() {
		return _sign;
	}

	function setName(name) {
		_name = name;
	}

	function getName() {
		return _name;
	}


	function toggleTurn() {
		_turn = _turn === true ? false : true;
		return _turn;
	}

	function hasTurn() {
		return _turn;
	}

	return { setSign, getSign, setName, getName, toggleTurn, hasTurn };
};

const Game = (function(){
	let firstPlayer = Player('X');
	let secondPlayer = Player('O');

	if(!firstPlayer.hasTurn()) firstPlayer.toggleTurn();


})();

const Display = (() => {
	let $grid = document.createElement('grid');
	$grid.className = 'grid';
	let bool_grid_added = false;

	function createGrid(size, board) {
		for (let i = 0; i < size * size; i++) {
			let col = i % size;
			let row = Math.floor(i / 3);
			let $cell = document.createElement('div');
			$cell.textContent = board[row][col];
			$cell.className = 'cell';
			addEvent($cell);
			$grid.appendChild($cell);
		}

		Signal.emit('board-created', size);
	}

	function addEvent($cell) {
		$cell.addEventListener('click', clickEvent);
	}

	function clickEvent(event) {
		event.target.className = 'cell clicked-cell';
		Signal.emit('cell-clicked', event.target);
	}

	function render() {
		if(!bool_grid_added) {
			document.getElementById('screen').appendChild($grid);
			bool_grid_added = !bool_grid_added;
		}
	}

	return { createGrid, render };
})();

Display.createGrid(3, GameBoard.getBoard());
Display.render();