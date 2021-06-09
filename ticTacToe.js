const PubSub = (() => {
	let events = {};

	function on(eventName, callback) {
		if(!events.hasOwnProperty(eventName)){
			events[eventName] = [];
			events[eventName].push(callback);
		}
		else {
			events[eventName].push(callback);
		}
	}

	function off(eventName, callback) {
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

	return { on, off, emit };
})();

const GameBoard = (() => {
	let board = [
		[0, 0, 0], 
		[0, 0, 0], 
		[0, 0, 0]
	];

	const getBoard = () => board;
	const updateBoard = (row, col, value) => {
		board[row][col] = value;
		PubSub.emit('updateBoard', {row, col, value});
	};

	return { getBoard, updateBoard };
})();

const Player = function(sign) {
	let _sign = sign || '';
	let _turn = false;

	function setSign(sign) {
		_sign = sign;
	}

	function getSign() {
		return _sign;
	}

	function toggleTurn() {
		_turn = _turn === true ? false : true;
		return _turn;
	}

	function hasTurn() {
		return _turn;
	}

	return { setSign, getSign, toggleTurn, hasTurn };
};

const Game = (function(){
	let firstPlayer = Player('X');

})();