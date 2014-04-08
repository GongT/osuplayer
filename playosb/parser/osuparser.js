function osuparser(osuData){
	var bgInfo = osuData.match(/^\[Events\]([\s\S]*?)^\[/m);
	if(bgInfo){
		bgInfo = OsuPlayer.background_regex.exec(bgInfo[1]);
		if(bgInfo){
			this.setBackground(bgInfo[2]);
		}
	}
}
