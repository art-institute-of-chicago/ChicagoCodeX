OsciTk.views.Info = OsciTk.views.BaseView.extend({
	id: 'toolbar-item-info',
	click: function(e) {
		window.open(app.config.get("baseUrl") + "/info", '_blank');
	}
});