OsciTk.views.BottomDrawerView = OsciTk.views.BaseView.extend({
	initialize: function() {
		this.isOpen = false;
		this.isActive = false;

		// close the drawer when requested
		this.listenTo(Backbone, 'drawersClose', function(caller) {
			if (caller !== this && this.isOpen === true) {
				this.closeDrawer();
			}
		});

		// move the drawer handle when the table of contents opens or closes
		this.listenTo(Backbone, 'tocOpening', function() {
			var handle = this.$el.find('.drawer-handle');
			var left = parseInt(handle.css('left'), 10);
			handle.animate({'left': (left + 200) + 'px'});
		});
		this.listenTo(Backbone, 'tocClosing', function() {
			var handle = this.$el.find('.drawer-handle');
			var left = parseInt(handle.css('left'), 10);
			handle.animate({'left': (left - 200) + 'px'});
		});

		this.listenTo(Backbone, "windowResized", function() {
			this.render();
		});

		// listen for other tabs going active
		this.listenTo(Backbone, 'tabActive', function(caller) {
			if (caller !== this) {
				this.setInactive();
			}
		});
		
		// listen for other tabs opening or closing
		this.listenTo(Backbone, 'tabOpening', function() {
			this.openDrawer();
		});
		this.listenTo(Backbone, 'tabClosing', function() {
				this.closeDrawer();
		});
	},
	toggleDrawer: function() {
		if (this.isOpen) {
			if (this.isActive) {
				// close drawer
				Backbone.trigger('tabClosing', this);
			} else {
				// make active
				this.setActive();
			}
		} else {
			// open drawer and make active
			Backbone.trigger('tabOpening', this);
			this.setActive();
		}
	},
	openDrawer: function() {
		// tell toc drawer to close
		Backbone.trigger('tocClose');
		this.$el.find('.drawer-content').animate({
			height: '300px'
		});
		this.isOpen = true;
	},
	closeDrawer: function() {
		var $this = this;
		this.$el.find('.drawer-content').animate({
			height: '0'
		}, null, null, function() {
			$this.setInactive();
		});
		this.isOpen = false;
	},
	setActive: function() {
		Backbone.trigger('tabActive', this);
		this.$el.css({'z-index': '101'});
		this.isActive = true;
	},
	setInactive: function() {
		this.$el.css({'z-index': '100'});
		this.isActive = false;
	}
});