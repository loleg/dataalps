// Set up data source links
function ShowSwissPopulationBFS(year) {
	lp = $('#legendbox .population');
	if (year != lp.attr('data-year'))
		lp.attr('data-year', year).html(year);
	applyData(SwissPopulationBFS, year, 
		function() { return CONF.PopulationScale; });
}
$('#legendbox .population').click(function() {
	if (toggleRadioBtn(this)) 
		ShowSwissPopulationBFS($(this).attr("data-year"));		
});
var spinTimeout, SPIN_SPEED = 300;
$('#legendbox .population-spin')
	.bind('mousedown', function() { 
		spinYearBtn($(this), $('#legendbox .population'));
	})
	.bind('mouseup mouseleave', function() { 
		clearTimeout(spinTimeout); SPIN_SPEED = 300;
		$(this).removeClass('on'); 
	});

$('#legendbox .commuting').click(function() {
	if (toggleRadioBtn(this)) {
		ShowSwissPopulationBFS(2011);
		applyGradient(SwissCommutersBFS, 'TotalCommuting');
	}
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

$('.zoomer').click(function() {
    if ($(this).hasClass('plus')) controls.dollyOut();
    if ($(this).hasClass('minus')) controls.dollyIn();
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
		clearFader = 1;
	} else {
		$(obj).addClass('on');
	}
	clearGradients();
	return !isOn;
}
function spinYearBtn(obj, lp) {
	if (!lp.hasClass('on')) lp.click();
	obj.addClass('on');
	var nextyear = parseInt(lp.attr('data-year'));
	nextyear += (obj.hasClass('plus')) ? 1 : -1;
	if (typeof SwissPopulationBFS[0][nextyear] != 'undefined')
		ShowSwissPopulationBFS(nextyear);
	// continue cycling
	SPIN_SPEED *= 0.9;
	spinTimeout = setTimeout(
		function() { spinYearBtn(lp, obj) }, SPIN_SPEED);
}
