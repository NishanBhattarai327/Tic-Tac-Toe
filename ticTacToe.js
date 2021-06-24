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

	function isBoardEmpty() {
		return board.every((value) => value !== '');
	}

	function updateBoard(cell) {
		let index = Number(cell.index), value = cell.value;

		if(index <= board.length) {
			board[index] = value;
		}
	}

	function checkForWin(player) {
		const wining_index_arr = [
			[0, 1, 2], [3, 4, 5], [6, 7, 8],
			[0, 3, 6], [1, 4, 7], [2, 5, 8],
			[0, 4, 8], [2, 4, 6]
		];

		let sign_indexs = board.reduce((acc, value, index) => {
			if (value === player.getSign())
				acc.push(index);
			return acc;
		}, []);


		let won = false;
		let winningCells;
		if (sign_indexs.length >= 3) {
			wining_index_arr.some((arr) => {
				won = arr.every((value) => {
					acc = sign_indexs.indexOf(value) !== -1;
					return acc;
				});

				if (won) {
					winningCells = [...arr];
				}
				return won;
			});
		}

		let status = '';
		if(isBoardEmpty()) {
			status = 'tie';
		}
		if(won === true) {
			status = 'win';
		}


		Signal.emit('display-game-ended-status', { player, status, winningCells });
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
	let xPlayer = Player('X');
	let oPlayer = Player('O');
	Signal.subscribe('cell-clicked', play);
	Signal.subscribe('set-player-name', setPlayerInfo);

	if(!xPlayer.hasTurn()) xPlayer.toggleTurn();

	function play(clickedCell) {
		let sign;
		let player;
		let index = Number(clickedCell.cell.dataset.index);

		if (xPlayer.hasTurn()) {
			sign = xPlayer.getSign();
			player = Object.create(xPlayer);
			xPlayer.toggleTurn();
			oPlayer.toggleTurn();
		}
		else if (oPlayer.hasTurn()) {
			sign = oPlayer.getSign();
			player = Object.create(oPlayer);
			oPlayer.toggleTurn();
			xPlayer.toggleTurn();
		}
		Signal.emit('display-cell-clicked', { cell:clickedCell.cell, sign });
		Signal.emit('update-board', { index, value:sign });
		Signal.emit('check-for-win', player);
	}

	function setPlayerInfo(info) {
		xPlayer.setName(info.firstPlayerName);
		oPlayer.setName(info.secondPlayerName);
	}

})();

const Display = (() => {
	let $grid = document.querySelector('#grid');
	let $btnReset = document.getElementById('reset-btn');
	$btnReset.addEventListener('click', resetTheGame);

	let bool_grid_added = false;

	Signal.subscribe('display-board', _createGrid);
	Signal.subscribe('display-cell-clicked', _updateCell);
	Signal.subscribe('display-game-ended-status', _endTheGame);

	/*Making message-pop-up window*****************/
	let $popUp = document.querySelector("#pop-up");
	let $popUp_closeBtn = document.querySelector(".pop-up-content-close");
	let $popUp_resetBtn = document.querySelector('#pop-up-reset-btn');

	// When the user clicks on <span> (x), close the $popUp
	$popUp_closeBtn.onclick = function() {
		hidePopUp();
	}
	// When the user clicks anywhere outside of the $popUp, close it
	window.onclick = function(event) {
	  if (event.target == $popUp) {
	    hidePopUp();
	  }
	}
	$popUp_resetBtn.onclick = function() {
		hidePopUp();
		resetTheGame();
	}
	/** end of pop-up window******************/

	let $displayPlayersName = document.getElementById('players-name');
	let $displayGame = document.getElementById('game');
	let $form = document.getElementById('form');
	$form.style.display = 'block';
	$displayGame.style.display = 'none';
	$form.addEventListener('submit', (event) => {
		event.preventDefault();
		toggleFormAndGame();
		let players = setPlayersInfo(event.target);
		displayPlayersName(players);
	});

	function hidePopUp() {
		$popUp.style.display = "none";
	}

	function showPopUp() {
		$popUp.style.display = 'block';
	}

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
		if (msg.status !== '') {
			let $msg = document.querySelector('.message');
			showPopUp();
			document.querySelectorAll('.cell').forEach((cell) => {
				cell.removeEventListener('click', _clickEvent);
			});

			if(msg.status === 'win') {
				highlightWinningCells(msg.winningCells);
				showWinningMessage($msg, msg);
			}
			else if(msg.status === 'tie') {
				showTieMessage($msg, msg);
			}
		}

	}

	function highlightWinningCells(cell_indexes) {
		document.querySelectorAll('.cell').forEach((cell) => {
			let index = Number(cell.dataset.index);
			if (cell_indexes.indexOf(index) !== -1) {
				if (!cell.classList.contains('winning-cell')) cell.className += ' winning-cell';
			}
		})
	}

	function showWinningMessage(dom, msg) {
		let info = msg.player.getName() !== '' ? msg.player.getName() : msg.player.getSign();
		dom.innerHTML = `<div class='win-msg'>GAME IS WON By <br> <span class='winner'>${info}</span class='winner'></div>`;
	}

	function showTieMessage(dom, msg) {
		dom.innerHTML = `<div class='loss-msg'>NO ONE IS WINNER</div>`;
	}	

	function showEditButton() {

	}

	function resetTheGame() {
		removeAllChild($grid);
		bool_grid_added = false;
		render();
	}

	function removeAllChild(parent) {
		while (parent.firstChild) {
			parent.removeChild(parent.firstChild);
		}
	}

	function getPlayersInfo($input) {
		let firstPlayerName = $input.xPlayerName.value;
		let secondPlayerName = $input.oPlayerName.value;
		$input.xPlayerName.value = '';
		$input.oPlayerName.value = '';
		return { firstPlayerName, secondPlayerName };
	}

	function setPlayersInfo($input) {
		let players = getPlayersInfo($input);
		Signal.emit('set-player-name', players);
		return players;
	}

	function toggleFormAndGame() {
		if ($form.style.display === 'block') {
			$displayGame.style.display = 'block';
			$form.style.display = 'none';
		}
		else if ($form.style.display === 'none') {
			$form.style.display = 'block';
			$displayGame.style.display = 'none';
		}
	}

	function displayPlayersName(players) {
		$displayPlayersName.innerHTML = 
		`<span class='player-name'>${players.firstPlayerName}</span> (x)
				<strong>Vs</strong>
		<span class='player-name'>${players.secondPlayerName}</span> (o)<br>
		 <button class='edit-players-name' id='edit-players-name'>Change Name</button>`;
		document.getElementById('edit-players-name').addEventListener('click', (event) => {
			toggleFormAndGame();
		});
	}

	function render() {
		if(!bool_grid_added) {
			let size = 3;
			Signal.emit('create-board', size);
			bool_grid_added = !bool_grid_added;
		}
	}

	return { render };
})();

Display.render();

