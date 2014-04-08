	function OnScreenDisplay(stage){
		this.layer = new Kinetic.Layer();
		stage.add(this.layer);
		this.offset = 0;
		this.items = {};
	}
	OnScreenDisplay.prototype.cleanUp = function (){
		this.layer.removeChildren();
		this.items = {};
		this.offset = 0;
	};

	OnScreenDisplay.prototype.hide = function (){
		this.layer.hide();
	};
	OnScreenDisplay.prototype.show = function (){
		this.layer.show().moveToTop();
	};

	OnScreenDisplay.prototype.label = function (label){
		if(this.items.hasOwnProperty(label)){
			return this.items[label];
		}
		var labelText = label + ': ';
		var val = new Kinetic.Text({
			text         : labelText + '-',
			x            : 5,
			y            : 5 + this.offset,
			fill         : '#555',
			shadowColor  : 'white',
			shadowBlur   : 3,
			shadowOffset : .5,
			shadowOpacity: .7,
			fontStyle: 'bold'
		});
		this.offset += 20;
		this.layer.add(val);
		return this.items[label] = function (new_val){
			val.setText(labelText + new_val);
		};
	};
