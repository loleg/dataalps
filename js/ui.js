// Set up data source links
$('#legendbox .population').click(function() {
	if (toggleRadioBtn(this))
		applyData(SwissPopulationBFS, $(this).attr("data-year"), 
			function() { return CONF.PopulationScale; });
});
$('#legendbox .commuting').click(function() {
	if (toggleRadioBtn(this))
		applyGradient(SwissCommutersBFS, 'TotalCommuting', 
			function(featurename) { 
				var data1 = $.grep(SwissPopulationBFS, function(n) { 
					return (featurename.indexOf(n.Kanton) > -1); });
				return data1[0]['2013']; 
			});
});
$('#legendbox .heatmap').click(function() {
	if (groupLights == null) return;
	if (SetupHeightMap != null) $('#legendbox .heightmap').click();
	var state = toggleDataBtn(this);
	groupLights.children.forEach(function(n) { n.visible = state });
	groupLights.visible = state;
	pointLight.visible = !state;
});
$('#legendbox .maplabels').click(function() {
	if (toggleDataBtn(this))
		$('.labels').fadeIn();
	else
		$('.labels').fadeOut();
});
$('#legendbox .heightmap').click(function() {
	if (groupLights.visible) $('#legendbox .heatmap').click();
	toggleHeightMap(toggleDataBtn(this));
});

// Fade out help after a few seconds
setTimeout(function() { $('#helpbox').fadeOut(); }, 
	CONF.HelpTimeout * 1000);

// Some more UI patching
function toggleDataBtn(obj) {
	var isOn = $(obj).hasClass('on');
	if (isOn) $(obj).removeClass('on');
	else $(obj).addClass('on');
	return !isOn;
}
function toggleRadioBtn(obj) {
	var isOn = $(obj).hasClass('on');
	$(obj).removeClass('on').parent().parent()
		  .find('.radio.on').removeClass('on');
	if (isOn) {
		// Things to do when clearing radio
		//clearData();
		clearFader = 1;
	} else {
		$(obj).addClass('on');
	}
	return !isOn;
}
