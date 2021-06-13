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
		'', '', '', 
		'', '', '', 
		'', '', ''
	];

	Signal.subscribe('create-board', createBoard);
	Signal.subscribe('update-board', updateBoard);
	Signal.subscribe('check-for-win', checkForWin);

	function createBoard(size) {
		board = [];
		for (let i = 0; i < size*size; i++) {
			board.push('');
		}

		Signal.emit('display-board', board);
	}

	function getBoard() {
		return board;
	}

	function updateBoard(cell) {
		let index = Number(cell.index), value = cell.value;

		if(index <= board.length) {
			board[index] = value;
		}
	}

	function checkForWin(sign) {
		const wining_index_arr = [
			[0, 1, 2], [3, 4, 5], [6, 7, 8],
			[0, 3, 6], [1, 4, 7], [2, 5, 8],
			[0, 4, 8], [2, 4, 6]
		];
		let won = false;

		let sign_indexs = board.reduce((acc, value, index) => {
			if (value === sign)
				acc.push(index);
			return acc;
		}, []);

		if (sign_indexs.length >= 3) {
			wining_index_arr.some((arr) => {
				won = arr.every((value) => {
					acc = sign_indexs.indexOf(value) !== -1;
					return acc;
				});
				return won;
			});
		}

		Signal.emit('win-status', {won, sign});
		return won;
	}

	return { getBoard, updateBoard, checkForWin };
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
	Signal.subscribe('cell-clicked', play);
	Signal.subscribe('win-status', gameOver);

	if(!firstPlayer.hasTurn()) firstPlayer.toggleTurn();

	function play(clickedCell) {
		let sign;
		let index = Number(clickedCell.cell.dataset.index);

		if (firstPlayer.hasTurn()) {
			sign = firstPlayer.getSign();
			firstPlayer.toggleTurn();
			secondPlayer.toggleTurn();
		}
		else if (secondPlayer.hasTurn()) {
			sign = secondPlayer.getSign();
			secondPlayer.toggleTurn();
			firstPlayer.toggleTurn();
		}
		Signal.emit('display-cell-clicked', { cell:clickedCell.cell, sign });
		Signal.emit('update-board', { index, value:sign });
		Signal.emit('check-for-win', sign);

	}

	function gameOver(player) {
		if(player.won) {
			console.log(player.sign + ' won the game');
			Signal.emit('display-won-status', { status: 'won', sign: player.sign });
		}
	}

})();

const Display = (() => {
	let $grid = document.createElement('grid');
	$grid.className = 'grid';
	let bool_grid_added = false;

	Signal.subscribe('display-board', _createGrid);
	Signal.subscribe('display-cell-clicked', _updateCell);
	Signal.subscribe('display-won-status', _endTheGame)

	function _createGrid(board) {
		let size = board.length;
		for (let i = 0; i < size; i++) {
			let $cell = document.createElement('div');
			$cell.textContent = board[i];
			$cell.className = 'cell';
			$cell.setAttribute('data-index', i);
			_addEvent($cell, _clickEvent);
			$grid.appendChild($cell);
		}
	}

	function _addEvent($cell, callback) {
		$cell.addEventListener('click', callback);
	}

	function _clickEvent(event) {
		let index = Number(event.target.dataset.index);
		let cell = event.target;

		event.target.className = 'cell clicked-cell';
		Signal.emit('cell-clicked', {index, cell});
	}

	function _updateCell(player) {
		player.cell.textContent = player.sign;
		player.cell.removeEventListener('click', _clickEvent);
	}	

	function _endTheGame(msg) {
		if(msg.status === 'won') {
			document.querySelectorAll('.cell').forEach((cell) => {
				cell.removeEventListener('click', _clickEvent);
			});
			showResetButton();
		}
	}

	function showResetButton() {
		let $btnReset = document.getElementById('reset-btn');
		$btnReset.style.display = 'block';
		$btnReset.addEventListener('click', resetTheGame);
	}

	function resetTheGame(event) {
		removeAllChild($grid);
		bool_grid_added = false;
		render();
		event.target.style.display = 'none';
	}

	function removeAllChild(parent) {
		while (parent.firstChild) {
			parent.removeChild(parent.firstChild);
		}
	}

	function render() {
		if(!bool_grid_added) {
			let size = 3;
			Signal.emit('create-board', size);
			document.getElementById('screen').appendChild($grid);
			bool_grid_added = !bool_grid_added;
		}
	}

	return { render };
})();

Display.render();