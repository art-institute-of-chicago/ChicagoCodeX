(function($)
{
    if (!$.osci) {
        $.osci = {};
    }

    $.osci.layout = function(el, data, options)
    {
        var base = this;

        base.$el = $(el);
        base.el = el;

        base.$el.data("osci.layout", base);
 
        base.init = function()
        {
            base.data = $(data).filter(".root");
            base.options = $.extend({}, $.osci.layout.defaultOptions, options);
            base.viewer = $("#" + base.options.viewerId);
 
            $(window).resize(function(){
                if (base.resizeTimer) clearTimeout(base.resizeTimer);
                base.resizeTimer = setTimeout(base.render, 100);
            });

            base.render();
        };

        base.render = function()
        {
            base.$el.append(base.data.clone());
            base.figures = $("figure", base.$el);
            base.viewer.empty();

            base.options.viewHeight = base.viewer.height();
            base.options.viewWidth  = base.viewer.width();
            base.options.columnCount = 1;
            base.options.pageCount = 1;

            _calcViewerInfo();

            _calcFigureInfo();

            base.$el.css("width", base.options.columnWidth + "px");
            //$("img",base.$el).css("width", base.options.columnWidth + "px");

            _processData(
                base.$el.children(),
                _newPage().appendTo(base.viewer)
            );

            base.$el.empty();
        };

        function _processData(data, page)
        {
            var maxHeight, heightRemain, leftOffset, topOffset = 0, lineHeight = 0, column, columns, pageColumnCount;

            maxHeight = base.options.innerPageHeight;

            columns = page.children("div.column");
            pageColumnCount = columns.length;

            if (pageColumnCount) {
                column = $(columns[pageColumnCount - 1]);
            } else {
                pageColumnCount++;
                column = _newColumn(pageColumnCount).appendTo(page);
            }

            data.each(function(i, elem){
                var clone, cloneCount = 0, colHeight, $elem = $(elem), figureLinks;

                switch(elem.tagName) {
                    case 'HEADER':
                    case 'SECTION':
                        if ($elem.attr("id") == 'field_osci_figures') {
                            return true;
                        }
                        page = _processData($elem.children(), page);
                        return true;
                        break;
                    default:
                        figureLinks = $("a.figure-link",$elem);
                        figureLinks.each(function(i, l){
                            base.figures.filter($(l).attr("href")).clone().appendTo(page);
                        });
                        column.append($elem.clone());
                        break;
                }

                lineHeight = parseFloat($elem.css("line-height"));
                heightRemain = maxHeight - column.height();

                while (heightRemain <= 0) {
                    base.options.columnCount++;
                    pageColumnCount++;

                    if (elem.tagName !== 'SECTION') {
                        colHeight = $elem.position().top + (Math.floor((maxHeight - $elem.position().top - parseInt(column.css("margin-top"))) / lineHeight) * lineHeight);
                        column.height(colHeight);
                        heightRemain -= maxHeight - colHeight;
                    }
 
                    if (pageColumnCount > base.options.columnsPerPage) {
                        base.options.pageCount++;
                        page = _newPage().appendTo(base.viewer);
                        pageColumnCount = 1;
                    }

                    column = _newColumn(pageColumnCount).appendTo(page);
                    if (elem.tagName !== 'SECTION' && heightRemain < 0) {
                        topOffset = $elem.height() + heightRemain;
                        if (topOffset % lineHeight !== 0) {
                            topOffset = (Math.ceil(topOffset / lineHeight) * lineHeight) + lineHeight;
                        } else {
                            topOffset += lineHeight;
                        }
                        clone = $elem.clone();
                        cloneCount++;
                        if (clone.attr("id")) {
                            clone.attr("id", clone.attr("id") + "-" + cloneCount);
                        }
                        clone.css("margin-top", "-" + topOffset + "px");
                        column.append(clone);
                    }
                    heightRemain = maxHeight - column.height() + topOffset;
                }
            });

            return page;
        }

        function _calcViewerInfo()
        {
            var colWidth = 0,
                perPage = 1,
                gutterCheck = 0;

            base.options.pageWidth = base.options.viewWidth - (base.options.outerPageGutter * 2);
            base.options.pageHeight = base.options.viewHeight - (base.options.outerPageGutter * 2);
            base.options.innerPageHeight = base.options.pageHeight - (base.options.innerPageGutter * 2);
            base.options.innerPageWidth = base.options.pageWidth - (base.options.innerPageGutter * 2);

            if (base.options.innerPageWidth < base.options.maxColumnWidth) {
                colWidth = base.options.innerPageWidth;
            } else {
                colWidth = base.options.maxColumnWidth;
            }

            base.options.columnWidth = colWidth;

            perPage = Math.floor(base.options.innerPageWidth / colWidth);
            if (base.options.innerPageWidth < (perPage * colWidth) + ((perPage - 1) * base.options.gutterWidth)) {
                perPage = perPage - 1;
            }

            gutterCheck = (base.options.innerPageWidth - (perPage * colWidth)) / (perPage - 1);

            if (gutterCheck > base.options.gutterWidth) {
                base.options.columnWidth = (base.options.innerPageWidth - (base.options.gutterWidth * (perPage - 1))) / perPage;
            }

            base.options.columnsPerPage = perPage;
        };

        function _newColumn(pageColumnCount)
        {
            var leftOffset = ((pageColumnCount - 1) * base.options.columnWidth) + (base.options.gutterWidth * (pageColumnCount - 1) + (base.options.innerPageGutter));

            return $("<div>", {
                "class" : "column column_" + base.options.columnCount,
                data : {column : base.options.columnCount},
                css : {
                    width : base.options.columnWidth + "px",
                    "margin-left" : leftOffset + "px",
                    "margin-top" : base.options.innerPageGutter + "px"
                } 
            });
        }

        function _newPage()
        {
            var leftGutterOffset = base.options.outerPageGutter;

            if (base.options.pageCount > 1) {
                leftGutterOffset = base.options.outerPageGutter + (base.options.outerPageGutter * 2 * (base.options.pageCount - 1));
            }
 
            return $("<div>",{
                "class" : "osci_page osci_page_" + base.options.pageCount,
                data : {page : base.options.pageCount},
                css : {
                    width : base.options.pageWidth + "px",
                    left : ((base.options.pageCount - 1) * base.options.pageWidth) + leftGutterOffset + "px",
                    top : base.options.outerPageGutter + "px",
                    height : base.options.pageHeight + "px"
                }
            });
        }

        function _calcFigureInfo()
        {
            base.figures.each(function(i, elem){
                var $elem, aspect, columns, position, verticalPosition, horizontalPosition, offsetLeft, offsetTop, width, height, captionHeight;
                $elem = $(elem);

                columns = $elem.data("columns");
                position = $elem.data("position");
                aspect = $elem.data("aspect");

                verticalPosition = position.substr(0,1);
                horizontalPosition = (position.length == 2) ? position.substr(1,1) : position.substr(0,1); 

                if (typeof(columns) == 'string' && columns.indexOf("%") > 0) {
                    columns = Math.ceil((parseInt(columns) / 100) * base.options.columnsPerPage);
                }

                if (columns > base.options.columnsPerPage || position == 'p') {
                    width = base.options.innerPageWidth;
                } else {
                    width = (columns * base.options.columnWidth) + (base.options.gutterWidth * (columns - 1));
                }
                $elem.css("width", width + "px");

                captionHeight = $("figcaption", $elem).height();
                height = (width / aspect) + captionHeight;
                if (position == 'p' || height > base.options.innerPageHeight) {
                    height = base.options.innerPageHeight;
                }
                $elem.css("height", height + "px");

                $(".figureContent", $elem).css({
                    width : width,
                    height : height - captionHeight
                });

                switch (horizontalPosition) {
                    case 'r':
                        offsetLeft = ((base.options.columnsPerPage - columns) * base.options.columnWidth) + (((base.options.columnsPerPage - 1) - (columns - 1)) * base.options.gutterWidth) + base.options.innerPageGutter;
                        break;
                    case 'l':
                    case 'p':
                        offsetLeft = base.options.innerPageGutter;
                        break;
                }
                $elem.css("margin-left", offsetLeft);

                switch (verticalPosition) {
                    case 't':
                    case 'p':
                        offsetTop = base.options.innerPageGutter;
                        break;
                    case 'b':
                        offsetTop = base.options.innerPageHeight - height + base.options.innerPageGutter;
                        break;
                }

                $elem.css("margin-top", offsetTop);
            });
        }

        base.init();
    };

    $.osci.layout.defaultOptions = {
        minColumnWidth : 200,
        maxColumnWidth : 300,
        gutterWidth : 40,
        innerPageGutter : 10,
        outerPageGutter : 20,
        viewerId : 'osci_viewer'
    };

    $.fn.osci_layout = function( data, options )
    {
        return this.each(function()
        {
            (new $.osci.layout(this, data, options)); 
        });
    };

})(jQuery);

var currentPage = 0;

jQuery(document).ready(function() {
    function navigateTo(to)
    {
        var newX, totalColumns, newPage, layoutData = jQuery("#osci_reader_content").data("osci.layout").options;
 
        switch(to.operation) {
            case 'first':
               currentPage = 0;
               break;

            case 'last':
               currentPage = layoutData.pageCount - 1;
               break;

            case 'next':
                currentPage++;
                if (currentPage >= layoutData.pageCount) {
                    currentPage--;
                    return;
                }
                break;

            case 'prev':
                if (currentPage < 1) {
                    return;
                }
                currentPage--;
                break;

            case 'page':
                if (to.value > layoutData.pageCount || to.value < 1) {
                    return;
                }
                currentPage = to.value - 1;
                break;

            case 'column':
                totalColumns = layoutData.columnsPerPage * layoutData.pageCount;
                if (to.value > totalColumns || to.value < 1) {
                    return;
                }

                newPage = Math.ceil(to.value / layoutData.columnsPerPage);
                navigateTo({operation:'page',value:newPage});
                return;
                break;
        }

        var newOffset = 0;
        if (currentPage > 0) {
            newOffset = -1 * ((currentPage * layoutData.pageWidth) + (layoutData.outerPageGutter * 2 * (currentPage)));
        }

        newX = newOffset;
        jQuery(".osci_page", "#osci_viewer").css({
            "-webkit-transform" : "translate(" + newX + "px, 0)",
            "-moz-transform" : "translate(" + newX + "px, 0)",
            "transform" : "translate(" + newX + "px, 0)"
        });
    };

    jQuery("<a>", {
        href : "#",
        "class" : "first awesome",
        html : "&laquo; first",
        click : function(e) {
            var $this = jQuery(this);
            e.preventDefault();
            navigateTo({operation:'first'});
        }
    }).appendTo("#osci_navigation");

    jQuery("<a>", {
        href : "#",
        "class" : "prev awesome",
        html : "&lsaquo; prev",
        click : function(e) {
            var $this = jQuery(this);
            e.preventDefault();
            navigateTo({operation:'prev'});
        }
    }).appendTo("#osci_navigation");

    jQuery("<a>", {
        href : "#",
        "class" : "next awesome",
        html : "next &rsaquo;",
        click : function(e) {
            var $this = jQuery(this);
            e.preventDefault();
            navigateTo({operation:'next'});
        }
    }).appendTo("#osci_navigation");

    jQuery("<a>", {
        href : "#",
        "class" : "last awesome",
        html : "last &raquo;",
        click : function(e) {
            var $this = jQuery(this);
            e.preventDefault();
            navigateTo({operation:'last'});
        }
    }).appendTo("#osci_navigation");

    jQuery("a.footnote-link, a.figure-link","#osci_viewer").live('click',function(e){
        e.preventDefault();
        var $this = jQuery(this);

        navigateTo({
	    operation : 'column',
            value : parseInt(jQuery($this.attr("href")).parent(".column").data("column"))
        });
    });

    jQuery(document).keydown(function(e){
        var keyCode = e.keyCode || e.which;

        switch(keyCode) {
            case 37:
                jQuery("a.prev").click();
                break;
            case 39:
                jQuery("a.next").click();
                break;
        }
    });

    var url = document.URL;
    url = url.replace("reader","bodycopy");

    var content = jQuery.osci.getUrl({ url: url });
    jQuery("#osci_reader_content").osci_layout(content.data, {});
});
