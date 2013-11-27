JSCovFileReporter = Backbone.View.extend({
    initialize: function (options) {
        var _this = this;
        this.options = options;
        _.bindAll.apply(_, [this].concat(_.filter(Object.keys(JSCovFileReporter.prototype), function(key){ return typeof _this[key] == 'function'})));
        this.open  = '<tr class="{class}"><td class="line">{line_number}</td><td class="hits">{count}</td><td class="source">';
        this.close = '</td></tr>';

        this.coverObject = this.options.coverObject;

        this.error = 0;
        this.pass = 0;
        this.total = 0;
    },

    // substitute credits: MooTools
    substitute: function(string, object){
        return string.replace(/\\?\{([^{}]+)\}/g, function(match, name){
            if (match.charAt(0) == '\\') return match.slice(1);
            return (object[name] !== null) ? object[name] : '';
        });
    },

    generateClose: function(count){
        return this.substitute(this.close, {
            count: count
        });
    },

    generateOpen: function(hit_count, line_number){
        return this.substitute(this.open, {
            'count': hit_count !== void 0 ? hit_count : '',
            'line_number': line_number,
            'class': hit_count === void 0 || hit_count > 0 ? 'hit' : 'miss'
        });
    },

    report: function () {
        var thisview = this;
        var i, l, k;

        var code = this.coverObject.source;

        // generate array of all tokens
        var codez = [];
        for (i = 0, l = code.length; i < l; i++){
            codez.push({
                pos: i,
                value: code.slice(i, i + 1)
            });
        }

        // CoverObject has keys like "12:200" which means from char 12 to 200
        // This orders all first gaps in a list of dictionaries to ease drawing table lines
        var lines = Object.keys(this.coverObject);
        lines = _.without(lines, 'source');
        var result = '';
        var number_trailing_whitespaces = 0;
        var trailing_whitespaces = '';


        // We will go from one gap to the next wrapping them in table lines
        for (i=0, l = codez.length; i < l; i++){

            var hit_count = this.coverObject[i+1];

            
            if(hit_count !== void 0){
              this.total++;
              if (hit_count > 0) this.pass++;
              else this.error++;
            }

            var limit = null;
            if (i+1 >= l) {
                limit = codez.length;
            }

            // Table line opening
            result += this.generateOpen(hit_count, i);

            // Add trailing white space if it existed from previous line without carriage returns
            if (number_trailing_whitespaces > 0 ) {
                result += trailing_whitespaces.replace(/(\r\n|\n|\r)/gm,"");
            }

            // Add lines of code without initial white spaces, and replacing conflictive chars
            result += codez[i].value[0].replace(/</g, '&lt;').replace(/>/g, '&gt;');

            // Count trailing white spaces for future line, then remove them
            var matches = result.match(/(\s+)$/);
            result = result.trimRight();

            if (matches !== null) {
                number_trailing_whitespaces = matches[0].length;
                trailing_whitespaces = matches[0];
            }
            else {
                number_trailing_whitespaces = 0;
            }

            // Generate table line closing
            result += this.generateClose(hit_count);
        }

        return result;
    }
});


JSCovReporter = Backbone.View.extend({
    initialize: function (options) {
        this.options = options;
        this.coverObject = this.options.coverObject;

        // Generate the report
        this.report();

        // Activate reporter.js scrolling UX
        onload();
    },

    report: function () {
        var result = '';
        var index = '';

        for (var file in this.coverObject) {
            var fileReporter = new JSCovFileReporter({ coverObject: this.coverObject[file] });

            var fileReport = fileReporter.report();
            var percentage = Math.round(fileReporter.pass / fileReporter.total * 100);

            this.error += fileReporter.error;
            this.pass  += fileReporter.pass;
            this.total += fileReporter.total;

            var type_coverage = "high";
            if (percentage < 75 && percentage >= 50) {
                type_coverage = 'medium';
            }
            else if (percentage < 50 && percentage >= 25) {
                type_coverage = 'low';
            }
            else if (percentage < 25) {
                type_coverage = 'terrible';
            }

            // Title
            result += '<h2 id="' + file + '" class="file-title">' + file + '</h2>';
            // Stats
            result += '<div class="stats ' + type_coverage + '"><div class="percentage">'+ percentage + '%</div>';
            result += '<div class="sloc">' + fileReporter.total + '</div><div class="hits">' + fileReporter.pass + '</div>';
            result += '<div class="misses">' + fileReporter.error + '</div></div>';
            // Report
            result += '<div class="file-report">';
            result += '<table id="source"><tbody>' + fileReport + '</tbody></table>';
            result += '</div>';

            // Menu index
            index += '<li><span class="cov ' + type_coverage + '">' + percentage + '</span><a href="#' + file+ '">' + file + '</a></li>';
        }

        $('#coverage').html(result);
        $('#menu').html(index);
    }
});
