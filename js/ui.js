// Set up data source links
$('#legendbox .population').click(function() {
	if (toggleRadioBtn(this))
		applyData(SwissPopulationBFS, $(this).html(), 
			function() { return CONF.PopulationScale; });
});
$('#legendbox .commuting').click(function() {
	if (toggleRadioBtn(this))
		applyData(SwissCommutersBFS, 'TotalCommuting', 
			function(featurename) { 
				return CONF.CommutersScale;
				//var data1 = $.grep(SwissPopulationBFS, function(n) { 
				//	return (featurename.indexOf(n.Kanton) > -1); });
				//return parseInt(20000 / data1[0]['2011']); 
			});
});
$('#legendbox .heatmap').click(function() {
	var state = toggleDataBtn(this);
	if (groupLights == null) return;
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
