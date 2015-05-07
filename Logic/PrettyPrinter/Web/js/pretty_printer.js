/**
 * Created by Till
 */


$(function () {
    var INDEX_FONTCOLUMN = 1; // 2nd td
    var NUM_NEIGHBOURS = 5; // paragraphs to be displayed after a highlighted one

    var pdf_url = $("#pdfFileName").attr("name");    // URL is fetched from div
    PDFView.open(pdf_url, 0);

    // load file chosen by user and highlight data
    $("#loadHistoryButton").change(function (e) {
        var upload = $(this)[0];
        var file = upload.files[0];
        var reader = new FileReader();

        reader.onload = function (event) {
            var data = event.target.result;
            var filecontent = data.match(/[^\r\n]+/g); // split by \n and remove \n
            highlightFiledata(filecontent);
            refresh_filter();
        };
        reader.readAsText(file);

        return false;
    });

    $("#pageSearchField").change(function (e) {
        var input = $("#pageSearchField").val();
        var aTag = $("a[name='" + input + "']");
        $('html,body').animate({scrollTop: aTag.offset().top}, 'slow');
    });

    function refresh_filter() {
        var isChecked = $("#filterCheckbox").is(":checked");
        if (isChecked) {
            hideRows();
        }
    }

    $("#fontRangeButton").click(function () {
        var min_font_size = parseFloat($("#minfontsize").val());
        var max_font_size = parseFloat($("#maxfontsize").val());

        higlightFontRange(min_font_size, max_font_size);
        mark_neighbours("nohide");
        refresh_filter();
    });

    $('#filterCheckbox').change(function () {
        if ($(this).is(":checked")) {
            hideRows();
        }
        else {
            showRows();
        }

    });

    $("#exportButton").click(function () {
        var all_selected = [];
        $('.selected_fontabbrv').each(function (index, obj) {
            var font_info = $(this).text();
            all_selected.push(font_info);
        });

        // remove duplicate entries
        var uniqueNames = [];
        $.each(all_selected, function (i, el) {
            if ($.inArray(el, uniqueNames) === -1) uniqueNames.push(el);
        });
        uniqueNames.sort();

        // convert to newline separated string
        var output_string = "";
        for (var i = 0; i < uniqueNames.length; i++) {
            var split = uniqueNames[i].split(" ");
            var font_name = split[0];
            var font_size = split[1];

            output_string += '&lt;HEADING name="article" fontabbrv="' + font_name + '" fontsize="' + font_size + '"/&gt;</br>'
        }

        exportPopup(output_string);
    });

    function higlightFontRange(min_value, max_value) {
        var tds = getAllTDs(INDEX_FONTCOLUMN);
        for (var i = 0; i < tds.length; i++) {
            var font_column = tds[i];
            var fontcolumn_text = font_column.text();
            var font_size = parseFloat(fontcolumn_text.match(/\d+(\.\d+)?$/)[0]);
            if (min_value <= font_size && font_size <= max_value) {
                font_column.addClass("range");
            }
        }
    }

    function highlightFiledata(filecontent) {
        var floatRegex = /^((\d+(\.\d *)?)|((\d*\.)?\d+))$/; // find float numbers
        for (var i = 0; i < filecontent.length; i++) {
            var item = filecontent[i];
            var tds = getAllTDs(INDEX_FONTCOLUMN);
            for (var j = 0; j < tds.length; j++) {
                var font_column = tds[j];
                var fontcolumn_text = font_column.text();

                // name & size vs. size only --> different comparison required
                // file contains only font sizes
                if (floatRegex.test(item)) {
                    var font_size = fontcolumn_text.match(/[\d\.]+$/g)[0];  // extract font size from second column
                    if (item == font_size) {
                        font_column.addClass("history");
                    }
                }
                // file contains font name & font size
                else if (fontcolumn_text.indexOf(item) > -1) {
                    font_column.addClass("history");
                }
            }
        }
        mark_neighbours("nohide");
    }

    function getAllTDs(column_index) {
        var tds = [];
        $("table tr").each(function () {
            var font_column = $(this).find('td').eq(column_index);
            if (font_column.length) {   // td @ column_index exists
                tds.push(font_column);
            }
        });
        return tds;
    }

    // Click on TDs
    $('td').unbind('click').click(function () {
        // click on first column
        if ($(this).index() != INDEX_FONTCOLUMN) {
            firstTDClickHandler.call(this);
        }
        // click on second column
        else {
            secondTDClickHandler.call(this);
        }
    });

    function firstTDClickHandler() {
        var td_text = $(this).text();

        // new search query
        if ($(PDFView.findBar.findField).val() != td_text) {
            var event = searchPDF(td_text);
            return window.dispatchEvent(event);
        }
        else {
            $("#findNext").click();
        }
    }

    function secondTDClickHandler() {
        var fontabbrv = $(this).text(); // Fontname & Fontsize -> "ACaslonPro 12"
        var matching_tds = getTDsSameFontabbrv(fontabbrv);

        for (var i = 0; i < matching_tds.length; i++) {
            var curr_td = matching_tds[i];
            var curr_class = curr_td.attr('class');
            // remove any other class names
            if (curr_class != "selected_fontabbrv") {
                curr_td.removeClass();
            }
            // toggle selected class name
            curr_td.toggleClass("selected_fontabbrv");
        }

        setNumSelected();
    }

    function getTDsSameFontabbrv(fontabbrv) {
        var tds = getAllTDs(INDEX_FONTCOLUMN);
        var matching_tds = [];
        for (var i = 0; i < tds.length; i++) {
            var iter_td = tds[i];
            if (fontabbrv == iter_td.text()) {
                matching_tds.push(iter_td);
            }
        }
        return matching_tds;
    }

    function setNumSelected() {
        var tds = getAllTDs(INDEX_FONTCOLUMN);
        var num = 0;
        for (var i = 0; i < tds.length; i++) {
            var curr_td = tds[i];
            var curr_class = curr_td.attr('class');
            if (curr_class == "selected_fontabbrv") {
                num++;
            }
        }
        $("#numSelected").text(num);
        document.title = 'Currently selected: ' + num;
    }

    // search with PDF.js
    function searchPDF(td_text) {
        PDFView.findBar.open();
        $(PDFView.findBar.findField).val(td_text);
        $("#tableDiv").focus();

        var event = document.createEvent('CustomEvent');
        event.initCustomEvent('find', true, true, {
            query: td_text,
            caseSensitive: $("#findMatchCase").prop('checked'),
            highlightAll: $("#findHighlightAll").prop('checked'),
            findPrevious: undefined
        });
        return event;
    }

    function exportPopup(text) {
        var w = window.open('', '', 'width=800,height=400,resizeable,scrollbars');
        w.document.write(text);
        w.document.close(); // needed for chrome and safari
    }

    // to give the user more context, NUM_NEIGHBOURS paragraphs following each highlighted paragraph won't be filtered out/hidden
    function mark_neighbours(class_name) {
        $("table tr td").each(function () {
            if ($(this).index() == INDEX_FONTCOLUMN) {
                var curr_class = $(this).attr('class');
                if (curr_class == "range" || curr_class == "history") {
                    var tds_frwd = [];
                    tds_frwd.push($(this));

                    for (var i = 0; i < NUM_NEIGHBOURS; i++) {
                        var next_td = getNextTD(tds_frwd[i]);
                        if (next_td.attr('class') == undefined) {
                            next_td.addClass(class_name);
                        }
                        tds_frwd.push(next_td);
                    }
                }
            }
        });
    }

    function getNextTD(td) {
        return td.parent().next().find("td").eq(1);
    }

    function hideRows() {
        showRows();
        $("table tr td").each(function () {
            if ($(this).index() == INDEX_FONTCOLUMN) {
                var curr_class = $(this).attr('class');
                if (curr_class == undefined) {
                    $(this).parent().hide();
                }
            }
        });
    }

    function showRows() {
        var rows = $('table tr');
        rows.show();
    }

    // Divs always stays at the same relative window position after scroll
    $(window).scroll(function () {
        var top = $(window).scrollTop();
        var pdf_top = $(window).scrollTop() + 60;
        $('#searchFieldLabel').animate({top: top}, 0);
        $('#pdfImage').animate({top: pdf_top}, 0);

    });

});