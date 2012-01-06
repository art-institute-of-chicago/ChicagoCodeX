(function($)
{
    if (!$.osci) {
        $.osci = {};
    }

    $.osci.more = function(options)
    {
        var base = this.more;

        base.tab_map = {};
        
        base.init = function()
        {
            var tabs;
            
            base.options = $.extend({}, $.osci.more.defaultOptions, options);
            base.container = $("#" + base.options.containerId);
            
            amplify.subscribe("osci_more_toggle", function(data) {
                if (!data) {
                    data = {};
                }
                
                if ((base.container.hasClass("open") && !data.osci_more_open) || data.osci_more_close) {
                    if (base.options.moreToggleCallback !== undefined) {
                        base.options.moreToggleCallback(base.container, "close");
                    }
                    base.container.removeClass("open");
                } else {
                    if (base.options.moreToggleCallback !== undefined) {
                        base.options.moreToggleCallback(base.container, "open");
                    }
                    base.container.addClass("open");
                }
            });
            
            amplify.subscribe("osci_more_goto", function(data) {
                var tabNum, tabData, tab, itemNumber, gotoPage,
                tabs = base.container.find("#" + base.options.tabContainerId);
            
                if (base.tab_map[data.tab_name] !== undefined) {
                    tabNum = base.tab_map[data.tab_name];
                    
                    tabs.tabs("select", tabNum);
                    
                    tab = tabs.find("div.ui-tabs-panel:not(.ui-tabs-hide)");
                    tabData = tab.data();
                    
                    itemNumber = $(data.selector, tab).index();
    
                    if (tabData.osci_pager_per_page > 1) {
                        gotoPage = Math.ceil(itemNumber / tabData.osci_pager_per_page) - 1;
                    } else {
                        gotoPage = itemNumber;
                    }
                    $("li.osci_pager_item:eq(" + gotoPage + ")", tab).children().click();
                    
                    amplify.publish("osci_more_toggle", {osci_more_open : true});
                }
            });
            
            base.container.addClass("open").find("a.osci_more_handle").click(function(e){
                e.preventDefault();
                amplify.publish("osci_more_toggle");
            }).click();
            
            tabs = $("<div>", {
                id : base.options.tabContainerId
            })
            .append('<ul><li class="placeholder_tab"><a href="#osci_more_tab_1">placeholder</a></li></ul><div id="osci_more_tab_1"></div>')
            .appendTo(base.container)
            .tabs({
                select : function(e, ui) {
                    for (var i in base.tab_map)
                    {
                        if (base.tab_map[i] == ui.index) {
                            base.selected_tab = i;
                        }
                    }
                }
            });
            tabs.tabs("remove", 0);
        };
        
        base.select_tab = function(tabName)
        {
            if (!tabName)
            {
                tabName = base.selected_tab;
            }

            var tabNum = base.tab_map[tabName],
                tabs = base.container.find("#" + base.options.tabContainerId);
                
            tabs.tabs("select", tabNum);
        };
        
        base.add_content = function(tabName, data, paginate, perPage, callback)
        {
            var tabNum, tabId = "osci_tab_" + tabName, tab, total, i, pager, item, maxPagesDisplay = 5, totalPages,
                tabs = $("#" + base.options.tabContainerId, base.container), tabWidth, calcWidth, pagerItemText, maxPagerItemText,
                pagerItems = [], hasPagerDisplayData = false, pagerControlWidth = 0, selectedTab;

            if (base.tab_map[tabName] !== undefined) {
                tabNum = base.tab_map[tabName];
            }
            
            if (tabNum == undefined) {
                tab = $("<div>",{
                    id : tabId
                }).appendTo(tabs);
                
                tabs.tabs("add", "#" + tabId, tabName);

                tabNum = tabs.tabs("length") - 1;
                base.tab_map[tabName] = tabNum;
            } else {
                tab = $("#" + tabId, tabs);
            }
            
            tab.empty();
            
            //maintain previous selected tab
            selectedTab = base.selected_tab;
            tabs.tabs("select", tabNum);
            if (selectedTab) {base.selected_tab = selectedTab};
            
            if (data.length) {
                if (paginate === true) {   
                    total = data.length;
                    //tab.append($("<div>",{"class" : "osci_pager_display_item"}).append(data).overscroll());
                    tab.append($("<div>",{"class" : "osci_pager_display_item"}).append(data));
                    tabWidth = tab.width();
                    
                    if (perPage === undefined) 
                    {
                        calcWidth = 0;
                        perPage = 0;
                        data.each(function(i, elem) {
                            var $elem = $(elem),
                                elemWidth = $elem.outerWidth(true);
                            
                            calcWidth = calcWidth + elemWidth;
                            if (calcWidth <= tabWidth) {
                                perPage = perPage + 1;
                            } else {
                                return false;
                            }
                        });
                    }
                    
                    data.hide();
                    
                    if (data.filter(":first").data("pager_display")) {
                        hasPagerDisplayData = true;
                    }
                    
                    totalPages = Math.ceil(total / perPage);
                    maxPagesDisplay = Math.min(maxPagesDisplay, totalPages);
                    
                    pager = $("<ul>", {
                        id : tabId + "_pager",
                        "class" : "osci_pager"
                    });
                    
                    var pagerNavFirst = $("<li>", {
                        html : $("<a>", {
                            text : "first",
                            data : {page_number : 0},
                            "class" : "osci_pager_nav_first"
                        }),
                        "class" : "osci_pager_nav_first"
                    });
                    pagerItems.push(pagerNavFirst);
                    
                    var pagerNavPrev = $("<li>", {
                        html : $("<a>", {
                            text : "prev",
                            data : {page_number : -1},
                            "class" : "osci_pager_nav_prev"
                        }),
                        "class" : "osci_pager_nav_prev"
                    });
                    pagerItems.push(pagerNavPrev);
                    
                    var pagerLess = $("<li>", {
                        html : $("<span>", {
                            text : "..."
                        }),
                        "class" : "less"
                    });
                    pagerItems.push(pagerLess);
                    
                    for (i = 1; i <= totalPages; i++) {
                        if (hasPagerDisplayData) {
                            if (perPage > 1) {
                                maxPagerItemText = (i * perPage) > total ? data.filter(":eq(" + (total - 1) + ")").attr("data-pager_display") : data.filter(":eq(" + ((i * perPage) - 1) + ")").attr("data-pager_display");
                                pagerItemText = data.filter(":eq(" + ((i * perPage) - perPage) + ")").attr("data-pager_display") + " - " + maxPagerItemText;
                            } else {
                                pagerItemText = data.filter(":eq(" + (i - 1) + ")").data("pager_display");
                            }
                        } else {
                            if (perPage > 1) {
                                maxPagerItemText = (i * perPage) > total ? total : (i * perPage);
                                pagerItemText = ((i * perPage) - perPage + 1) + " - " + maxPagerItemText;
                            } else {
                                pagerItemText = i;
                            }
                        }
                        
                        item = $("<li>",{
                            html : $("<a>",{
                                text : pagerItemText,
                                data : {page_number : i - 1},
                                href : "#"                            
                            }),
                            "class" : "osci_pager_item"
                        }).hide();
                        
                        if (i === 1) {
                            item.addClass("first");
                        }
                        
                        if (i === totalPages) {
                            item.addClass("last");
                        }
                        
                        pagerItems.push(item);
                    } 
                    
                    var pagerMore = $("<li>", {
                        html : $("<span>", {
                            text : "..."
                        }),
                        "class" : "more"
                    });
                    pagerItems.push(pagerMore);
                    
                    var pagerNext = $("<li>", {
                        html : $("<a>", {
                            text : "next",
                            data : {page_number : 1},
                            "class" : "osci_pager_nav_next"
                        }),
                        "class" : "osci_pager_nav_next"
                    });
                    pagerItems.push(pagerNext);
                    
                    var pagerLast = $("<li>", {
                        html : $("<a>", {
                            text : "last",
                            data : {page_number : totalPages - 1},
                            "class" : "osci_pager_nav_last"
                        }),
                        "class" : "osci_pager_nav_last"
                    });
                    pagerItems.push(pagerLast);
                    
                    pager.append.apply(pager, pagerItems);
                   
                    pager.delegate("a", "click", function(e) {
                        e.preventDefault();
                        var $this = $(this),
                            pageNum = $this.data("page_number"),
                            container = $this.parents(".ui-tabs-panel"),
                            currentPage = container.data("osci_pager_current_page"),
                            totalPages = container.data("osci_pager_total_pages"),
                            perPage = container.data("osci_pager_per_page"),
                            pagerItems = container.find("li.osci_pager_item"),
                            maxPagesDisplay = container.data("osci_pager_max_pages_display"),
                            pagerItem, startItem, endItem;
                        
                        if ($this.hasClass("osci_pager_nav_next")) {
                            pageNum = currentPage + 1;
                            if (pageNum >= totalPages) {
                                pageNum = totalPages - 1;
                            }
                        } else if ($this.hasClass("osci_pager_nav_prev")) {
                            pageNum = currentPage - 1;
                            if (pageNum < 0) {
                                pageNum = 0;
                            }
                        }

                        pagerItem = container.find("li.osci_pager_item:eq(" + pageNum + ")");
                        container.data("osci_pager_current_page", pageNum);
                        pagerItems.removeClass("active");
                        pagerItem.addClass("active");

                        if (pagerItem.css("display") == 'none') {
                            if (pageNum > currentPage) {
                                pagerItems.css({display:"none"}).slice(pageNum - maxPagesDisplay + 1, pageNum  + 1).removeAttr("style");
                            } else {
                                pagerItems.css({display:"none"}).slice(pageNum, pageNum + maxPagesDisplay).removeAttr("style");
                            }
                        }
                        
                        if (pagerItems.filter(".last:visible").length){                   
                            container.find("li.more").text("");
                        } else {
                            container.find("li.more").text("...");
                        }
                        
                        if (pagerItems.filter(".first:visible").length){
                            container.find("li.less").text("");
                        } else {
                            container.find("li.less").text("...");
                        }
                        
                        startItem = pageNum * perPage;
                        endItem = startItem + perPage;
                        
                        container.find("div.osci_pager_display_item").children().css({display:"none"}).slice(startItem, endItem).removeAttr("style");
                    });
                    
                    tab.data({
                        osci_pager_total_items : total,
                        osci_pager_total_pages : totalPages,
                        osci_pager_per_page : perPage,
                        osci_pager_current_page : 1,
                        osci_pager_max_pages_display : maxPagesDisplay
                    }).append(pager);
                    
                    pagerControlWidth += pagerNavFirst.outerWidth(true);
                    pagerControlWidth += pagerNavPrev.outerWidth(true);
                    pagerControlWidth += pagerLess.outerWidth(true);
                    pagerControlWidth += pagerMore.outerWidth(true);
                    pagerControlWidth += pagerNext.outerWidth(true);
                    pagerControlWidth += pagerLast.outerWidth(true);
                    
                    var availablePagerSpace = tabWidth - pagerControlWidth;
                    maxPagesDisplay = Math.round(availablePagerSpace / 100);
                    maxPagesDisplay = maxPagesDisplay < 1 ? 1 : maxPagesDisplay;
                    maxPagesDisplay = maxPagesDisplay > 5 ? 5 : maxPagesDisplay;
                    tab.data("osci_pager_max_pages_display", maxPagesDisplay);
                    
                    pagerNavFirst.find("a").click();
                } else {
                    tab.html(data);
                }
                
                if ($.isFunction(callback)) {
                    callback(tab);
                }
            }
        }
        
        base.init();
    };

    $.osci.more.defaultOptions = {
        containerId : "osci_more_wrapper",
        tabContainerId : "osci_more_tabs",
        defaultTabs : ["footnotes"],
        moreToggleCallback : undefined
    };

})(jQuery);