var OsbCommands = {
	F : [
		{argStart: {pos: 0, def: 1}, argEnd: {pos: 1}, setter: 'setOpacity', var: 'Fade'}
	],
	M : [
		{argStart: {pos: 0, def: 0}, argEnd: {pos: 2}, setter: 'setX', var: 'X'},
		{argStart: {pos: 1, def: 0}, argEnd: {pos: 3}, setter: 'setY', var: 'Y'}
	],
	MX: [
		{argStart: {pos: 0, def: 0}, argEnd: {pos: 1}, setter: 'setX', var: 'X'},
	],
	MY: [
		{argStart: {pos: 0, def: 0}, argEnd: {pos: 1}, setter: 'setY', var: 'Y'},
	],
	S : [
		{argStart: {pos: 0, def: 1}, argEnd: {pos: 1}, setter: 'setScaleX', var: 'scaleX'},
		{argStart: {pos: 0, def: 1}, argEnd: {pos: 1}, setter: 'setScaleY', var: 'scaleY'},
	],
	V : [
		{argStart: {pos: 0, def: 1}, argEnd: {pos: 2}, setter: 'setScaleX', var: 'scaleX'},
		{argStart: {pos: 1, def: 1}, argEnd: {pos: 3}, setter: 'setScaleY', var: 'scaleY'},
	],
	R : [
		{argStart: {pos: 0, def: 1}, argEnd: {pos: 1, def: 1}, setter: 'setRotationDeg', var: 'rotate'},
	]
};
