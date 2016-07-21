/*jslint browser: true*/
/*global $, jQuery, alert, d3*/
/*global d3*/


// Read flare.json in python and make a "group" field  for each entry
// Get things working

// Entry point that runs when the page is finished loading
$(document).ready(function () {
    'use strict';

    // Sandbox function for application
    var Sandbox = function () {

            // turning arguments into an array
            var args = Array.prototype.slice.call(arguments),
                // the last argument is the callback
                callback = args.pop(),
                // modules can be passed as an array or as individual parameters
                modules = (args[0] && typeof args[0] === 'string') ? args : args[0],
                i;

            // make sure the function is called as a constructor
            if (!(this instanceof Sandbox)) {
                return new Sandbox(modules, callback);
            }

            // now add modules to the core 'this' object
            // no modules or '*' meaan 'use all modules'
            if (!modules || modules === '*') {
                modules = [];
                for (i in Sandbox.modules) {
                    if (Sandbox.modules.hasOwnProperty(i)) {
                        modules.push(i);
                    }
                }
            }

            // initialize the required modules
            for (i = 0; i < modules.length; i += 1) {
                Sandbox.modules[modules[i]](this);
            }

            // call the callback
            callback(this);
        },
        namespace = function (root, ns_string) {
            var parts = ns_string.split('.'),
                parent = root,
                i;

            // strip redundant leading global
            if (parts[0] === 'box') {
                parts = parts.slice(1);
            }

            for (i = 0; i < parts.length; i += 1) {
                // create property if it does not already exist
                if (parent[parts[i]] === undefined) {
                    parent[parts[i]] = {};
                }
                parent = parent[parts[i]];
            }
            return parent;
        };

    // Actual call to sandbox
    new Sandbox(function (env) {

        namespace(env, 'util');
        namespace(env, 'view');
        namespace(env, 'model');

        // General helper functions not tied to UI
        env.util = {
            deleteChars: function (str, chars) {
                // Delete all instances of each char in chars from the string str
                // @param str string to remove each char from
                // @param chars array of characters to remove
                // @return the string, updated without any of the characters
                var i,
                    len = chars.length;
                for (i = 0; i < len; i += 1) {
                    if (str.indexOf(chars.charAt(i)) > -1) {
                        str = env.util.replaceAllChars(str, chars.charAt(i), '');
                    }
                }
                return str;
            },
            valueBetweenParentheses: function (str) {
                if (str.indexOf('(') < 0 || str.indexOf(')') < 0) {
                    alert("called env.util.valueBetweenParentheses() on string token that does not have both open and close parentheses!");
                }
                return str.substring(str.indexOf('(') + 1, str.indexOf(')'));
            },
            minOf: function (num1, num2) {
                var min;
                if (num1 === -1 && num2 === -1) {
                    throw "Cannot return min index of two non-existent characters in string!";
                }

                if (num1 === -1) {
                    min = num2;
                } else if (num2 === -1) {
                    min = num1;
                } else if (num1 <= num2) {
                    min = num1;
                } else {
                    min = num2;
                }
                return min;
            },
            replaceAllChars: function (string, tok, newTok) {
                if (string.indexOf(" ") === -1) {
                    return string;
                }
                return env.util.replaceAllChars(string.replace(" ", newTok), tok, newTok);
            },
            consoleMessage: function (title, content) {
                console.log(title);
                console.log(content);
            },
            copyOf: function (obj) {
                var key,
                    copy = {};
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        copy[key] = obj[key];
                    }
                }
                return copy;
            },
            extendPrototype: function () {
                var key,
                    args = arguments,
                    protoToCopy = args[0].prototype,
                    objects = Array.prototype.slice.call(args, 1),
                    extendPrototype = function (obj) {
                        if (!obj.prototype) {
                            obj.prototype = {};
                        }
                        obj.prototype[key] = protoToCopy[key];
                    };
                for (key in protoToCopy) {
                    if (protoToCopy.hasOwnProperty(key)) {
                        objects.forEach(extendPrototype);
                    }
                }
            },
            graphTraverse: function (graphNode, path, visit) {
                function recurse(graphNode, path, visit) {
                    var i, len, children;
                    graphNode = visit(graphNode);
                    path.push(graphNode);
                    children = graphNode.children || [];
                    for (i = 0, len = children.length; i < len; i += 1) {
                        if (!_.contains(path, graphNode.children[i])) {
                            graphNode.children[i] = recurse(graphNode.children[i], path, visit);
                        }
                    }
                    return graphNode;
                }

                return recurse(graphNode, path, visit);
            }
        };

        // Global namespace and sub-namespaces for the entire application
        var colors = {
                black: '#000000',
                dark_gray: '#606060',
                light_gray: '#E0E0E0',
                yellow: '#CCCC00',
                light_blue: '#00FFFF',
                pink: '#FF007F',
                orange: '#FF9900',
                blue: '#2B7CE9',
                purple: '#9933FF',
                red: '#C5000B',
                green: '#109618'
            },
            nodeGroups = [],
            n_groups = 0,
            json_data = '{"name": "flare", "level": 0, "children": [{"name": "analytics", "level": 1, "children": [{"name": "cluster", "level": 2, "children": [{"name": "AgglomerativeCluster", "level": 3, "size": 3938, "group": 3}, {"name": "CommunityStructure", "level": 3, "size": 3812, "group": 3}, {"name": "HierarchicalCluster", "level": 3, "size": 6714, "group": 3}, {"name": "MergeEdge", "level": 3, "size": 743, "group": 3}], "group": 2}, {"name": "graph", "level": 2, "children": [{"name": "BetweennessCentrality", "level": 3, "size": 3534, "group": 3}, {"name": "LinkDistance", "level": 3, "size": 5731, "group": 3}, {"name": "MaxFlowMinCut", "level": 3, "size": 7840, "group": 3}, {"name": "ShortestPaths", "level": 3, "size": 5914, "group": 3}, {"name": "SpanningTree", "level": 3, "size": 3416, "group": 3}], "group": 2}, {"name": "optimization", "level": 2, "children": [{"name": "AspectRatioBanker", "level": 3, "size": 7074, "group": 3}], "group": 2}], "group": 1}, {"name": "animate", "level": 1, "children": [{"name": "Easing", "level": 2, "size": 17010, "group": 2}, {"name": "FunctionSequence", "level": 2, "size": 5842, "group": 2}, {"name": "interpolate", "level": 2, "children": [{"name": "ArrayInterpolator", "level": 3, "size": 1983, "group": 3}, {"name": "ColorInterpolator", "level": 3, "size": 2047, "group": 3}, {"name": "DateInterpolator", "level": 3, "size": 1375, "group": 3}, {"name": "Interpolator", "level": 3, "size": 8746, "group": 3}, {"name": "MatrixInterpolator", "level": 3, "size": 2202, "group": 3}, {"name": "NumberInterpolator", "level": 3, "size": 1382, "group": 3}, {"name": "ObjectInterpolator", "level": 3, "size": 1629, "group": 3}, {"name": "PointInterpolator", "level": 3, "size": 1675, "group": 3}, {"name": "RectangleInterpolator", "level": 3, "size": 2042, "group": 3}], "group": 2}, {"name": "ISchedulable", "level": 2, "size": 1041, "group": 2}, {"name": "Parallel", "level": 2, "size": 5176, "group": 2}, {"name": "Pause", "level": 2, "size": 449, "group": 2}, {"name": "Scheduler", "level": 2, "size": 5593, "group": 2}, {"name": "Sequence", "level": 2, "size": 5534, "group": 2}, {"name": "Transition", "level": 2, "size": 9201, "group": 2}, {"name": "Transitioner", "level": 2, "size": 19975, "group": 2}, {"name": "TransitionEvent", "level": 2, "size": 1116, "group": 2}, {"name": "Tween", "level": 2, "size": 6006, "group": 2}], "group": 1}, {"name": "data", "level": 1, "children": [{"name": "converters", "level": 2, "children": [{"name": "Converters", "level": 3, "size": 721, "group": 3}, {"name": "DelimitedTextConverter", "level": 3, "size": 4294, "group": 3}, {"name": "GraphMLConverter", "level": 3, "size": 9800, "group": 3}, {"name": "IDataConverter", "level": 3, "size": 1314, "group": 3}, {"name": "JSONConverter", "level": 3, "size": 2220, "group": 3}], "group": 2}, {"name": "DataField", "level": 2, "size": 1759, "group": 2}, {"name": "DataSchema", "level": 2, "size": 2165, "group": 2}, {"name": "DataSet", "level": 2, "size": 586, "group": 2}, {"name": "DataSource", "level": 2, "size": 3331, "group": 2}, {"name": "DataTable", "level": 2, "size": 772, "group": 2}, {"name": "DataUtil", "level": 2, "size": 3322, "group": 2}], "group": 1}, {"name": "display", "level": 1, "children": [{"name": "DirtySprite", "level": 2, "size": 8833, "group": 2}, {"name": "LineSprite", "level": 2, "size": 1732, "group": 2}, {"name": "RectSprite", "level": 2, "size": 3623, "group": 2}, {"name": "TextSprite", "level": 2, "size": 10066, "group": 2}], "group": 1}, {"name": "flex", "level": 1, "children": [{"name": "FlareVis", "level": 2, "size": 4116, "group": 2}], "group": 1}, {"name": "physics", "level": 1, "children": [{"name": "DragForce", "level": 2, "size": 1082, "group": 2}, {"name": "GravityForce", "level": 2, "size": 1336, "group": 2}, {"name": "IForce", "level": 2, "size": 319, "group": 2}, {"name": "NBodyForce", "level": 2, "size": 10498, "group": 2}, {"name": "Particle", "level": 2, "size": 2822, "group": 2}, {"name": "Simulation", "level": 2, "size": 9983, "group": 2}, {"name": "Spring", "level": 2, "size": 2213, "group": 2}, {"name": "SpringForce", "level": 2, "size": 1681, "group": 2}], "group": 1}, {"name": "query", "level": 1, "children": [{"name": "AggregateExpression", "level": 2, "size": 1616, "group": 2}, {"name": "And", "level": 2, "size": 1027, "group": 2}, {"name": "Arithmetic", "level": 2, "size": 3891, "group": 2}, {"name": "Average", "level": 2, "size": 891, "group": 2}, {"name": "BinaryExpression", "level": 2, "size": 2893, "group": 2}, {"name": "Comparison", "level": 2, "size": 5103, "group": 2}, {"name": "CompositeExpression", "level": 2, "size": 3677, "group": 2}, {"name": "Count", "level": 2, "size": 781, "group": 2}, {"name": "DateUtil", "level": 2, "size": 4141, "group": 2}, {"name": "Distinct", "level": 2, "size": 933, "group": 2}, {"name": "Expression", "level": 2, "size": 5130, "group": 2}, {"name": "ExpressionIterator", "level": 2, "size": 3617, "group": 2}, {"name": "Fn", "level": 2, "size": 3240, "group": 2}, {"name": "If", "level": 2, "size": 2732, "group": 2}, {"name": "IsA", "level": 2, "size": 2039, "group": 2}, {"name": "Literal", "level": 2, "size": 1214, "group": 2}, {"name": "Match", "level": 2, "size": 3748, "group": 2}, {"name": "Maximum", "level": 2, "size": 843, "group": 2}, {"name": "methods", "level": 2, "children": [{"name": "add", "level": 3, "size": 593, "group": 3}, {"name": "and", "level": 3, "size": 330, "group": 3}, {"name": "average", "level": 3, "size": 287, "group": 3}, {"name": "count", "level": 3, "size": 277, "group": 3}, {"name": "distinct", "level": 3, "size": 292, "group": 3}, {"name": "div", "level": 3, "size": 595, "group": 3}, {"name": "eq", "level": 3, "size": 594, "group": 3}, {"name": "fn", "level": 3, "size": 460, "group": 3}, {"name": "gt", "level": 3, "size": 603, "group": 3}, {"name": "gte", "level": 3, "size": 625, "group": 3}, {"name": "iff", "level": 3, "size": 748, "group": 3}, {"name": "isa", "level": 3, "size": 461, "group": 3}, {"name": "lt", "level": 3, "size": 597, "group": 3}, {"name": "lte", "level": 3, "size": 619, "group": 3}, {"name": "max", "level": 3, "size": 283, "group": 3}, {"name": "min", "level": 3, "size": 283, "group": 3}, {"name": "mod", "level": 3, "size": 591, "group": 3}, {"name": "mul", "level": 3, "size": 603, "group": 3}, {"name": "neq", "level": 3, "size": 599, "group": 3}, {"name": "not", "level": 3, "size": 386, "group": 3}, {"name": "or", "level": 3, "size": 323, "group": 3}, {"name": "orderby", "level": 3, "size": 307, "group": 3}, {"name": "range", "level": 3, "size": 772, "group": 3}, {"name": "select", "level": 3, "size": 296, "group": 3}, {"name": "stddev", "level": 3, "size": 363, "group": 3}, {"name": "sub", "level": 3, "size": 600, "group": 3}, {"name": "sum", "level": 3, "size": 280, "group": 3}, {"name": "update", "level": 3, "size": 307, "group": 3}, {"name": "variance", "level": 3, "size": 335, "group": 3}, {"name": "where", "level": 3, "size": 299, "group": 3}, {"name": "xor", "level": 3, "size": 354, "group": 3}, {"name": "_", "level": 3, "size": 264, "group": 3}], "group": 2}, {"name": "Minimum", "level": 2, "size": 843, "group": 2}, {"name": "Not", "level": 2, "size": 1554, "group": 2}, {"name": "Or", "level": 2, "size": 970, "group": 2}, {"name": "Query", "level": 2, "size": 13896, "group": 2}, {"name": "Range", "level": 2, "size": 1594, "group": 2}, {"name": "StringUtil", "level": 2, "size": 4130, "group": 2}, {"name": "Sum", "level": 2, "size": 791, "group": 2}, {"name": "Variable", "level": 2, "size": 1124, "group": 2}, {"name": "Variance", "level": 2, "size": 1876, "group": 2}, {"name": "Xor", "level": 2, "size": 1101, "group": 2}], "group": 1}, {"name": "scale", "level": 1, "children": [{"name": "IScaleMap", "level": 2, "size": 2105, "group": 2}, {"name": "LinearScale", "level": 2, "size": 1316, "group": 2}, {"name": "LogScale", "level": 2, "size": 3151, "group": 2}, {"name": "OrdinalScale", "level": 2, "size": 3770, "group": 2}, {"name": "QuantileScale", "level": 2, "size": 2435, "group": 2}, {"name": "QuantitativeScale", "level": 2, "size": 4839, "group": 2}, {"name": "RootScale", "level": 2, "size": 1756, "group": 2}, {"name": "Scale", "level": 2, "size": 4268, "group": 2}, {"name": "ScaleType", "level": 2, "size": 1821, "group": 2}, {"name": "TimeScale", "level": 2, "size": 5833, "group": 2}], "group": 1}, {"name": "util", "level": 1, "children": [{"name": "Arrays", "level": 2, "size": 8258, "group": 2}, {"name": "Colors", "level": 2, "size": 10001, "group": 2}, {"name": "Dates", "level": 2, "size": 8217, "group": 2}, {"name": "Displays", "level": 2, "size": 12555, "group": 2}, {"name": "Filter", "level": 2, "size": 2324, "group": 2}, {"name": "Geometry", "level": 2, "size": 10993, "group": 2}, {"name": "heap", "level": 2, "children": [{"name": "FibonacciHeap", "level": 3, "size": 9354, "group": 3}, {"name": "HeapNode", "level": 3, "size": 1233, "group": 3}], "group": 2}, {"name": "IEvaluable", "level": 2, "size": 335, "group": 2}, {"name": "IPredicate", "level": 2, "size": 383, "group": 2}, {"name": "IValueProxy", "level": 2, "size": 874, "group": 2}, {"name": "math", "level": 2, "children": [{"name": "DenseMatrix", "level": 3, "size": 3165, "group": 3}, {"name": "IMatrix", "level": 3, "size": 2815, "group": 3}, {"name": "SparseMatrix", "level": 3, "size": 3366, "group": 3}], "group": 2}, {"name": "Maths", "level": 2, "size": 17705, "group": 2}, {"name": "Orientation", "level": 2, "size": 1486, "group": 2}, {"name": "palette", "level": 2, "children": [{"name": "ColorPalette", "level": 3, "size": 6367, "group": 3}, {"name": "Palette", "level": 3, "size": 1229, "group": 3}, {"name": "ShapePalette", "level": 3, "size": 2059, "group": 3}, {"name": "SizePalette", "level": 3, "size": 2291, "group": 3}], "group": 2}, {"name": "Property", "level": 2, "size": 5559, "group": 2}, {"name": "Shapes", "level": 2, "size": 19118, "group": 2}, {"name": "Sort", "level": 2, "size": 6887, "group": 2}, {"name": "Stats", "level": 2, "size": 6557, "group": 2}, {"name": "Strings", "level": 2, "size": 22026, "group": 2}], "group": 1}, {"name": "vis", "level": 1, "children": [{"name": "axis", "level": 2, "children": [{"name": "Axes", "level": 3, "size": 1302, "group": 3}, {"name": "Axis", "level": 3, "size": 24593, "group": 3}, {"name": "AxisGridLine", "level": 3, "size": 652, "group": 3}, {"name": "AxisLabel", "level": 3, "size": 636, "group": 3}, {"name": "CartesianAxes", "level": 3, "size": 6703, "group": 3}], "group": 2}, {"name": "controls", "level": 2, "children": [{"name": "AnchorControl", "level": 3, "size": 2138, "group": 3}, {"name": "ClickControl", "level": 3, "size": 3824, "group": 3}, {"name": "Control", "level": 3, "size": 1353, "group": 3}, {"name": "ControlList", "level": 3, "size": 4665, "group": 3}, {"name": "DragControl", "level": 3, "size": 2649, "group": 3}, {"name": "ExpandControl", "level": 3, "size": 2832, "group": 3}, {"name": "HoverControl", "level": 3, "size": 4896, "group": 3}, {"name": "IControl", "level": 3, "size": 763, "group": 3}, {"name": "PanZoomControl", "level": 3, "size": 5222, "group": 3}, {"name": "SelectionControl", "level": 3, "size": 7862, "group": 3}, {"name": "TooltipControl", "level": 3, "size": 8435, "group": 3}], "group": 2}, {"name": "data", "level": 2, "children": [{"name": "Data", "level": 3, "size": 20544, "group": 3}, {"name": "DataList", "level": 3, "size": 19788, "group": 3}, {"name": "DataSprite", "level": 3, "size": 10349, "group": 3}, {"name": "EdgeSprite", "level": 3, "size": 3301, "group": 3}, {"name": "NodeSprite", "level": 3, "size": 19382, "group": 3}, {"name": "render", "level": 3, "children": [{"name": "ArrowType", "level": 4, "size": 698, "group": 4}, {"name": "EdgeRenderer", "level": 4, "size": 5569, "group": 4}, {"name": "IRenderer", "level": 4, "size": 353, "group": 4}, {"name": "ShapeRenderer", "level": 4, "size": 2247, "group": 4}], "group": 3}, {"name": "ScaleBinding", "level": 3, "size": 11275, "group": 3}, {"name": "Tree", "level": 3, "size": 7147, "group": 3}, {"name": "TreeBuilder", "level": 3, "size": 9930, "group": 3}], "group": 2}, {"name": "events", "level": 2, "children": [{"name": "DataEvent", "level": 3, "size": 2313, "group": 3}, {"name": "SelectionEvent", "level": 3, "size": 1880, "group": 3}, {"name": "TooltipEvent", "level": 3, "size": 1701, "group": 3}, {"name": "VisualizationEvent", "level": 3, "size": 1117, "group": 3}], "group": 2}, {"name": "legend", "level": 2, "children": [{"name": "Legend", "level": 3, "size": 20859, "group": 3}, {"name": "LegendItem", "level": 3, "size": 4614, "group": 3}, {"name": "LegendRange", "level": 3, "size": 10530, "group": 3}], "group": 2}, {"name": "operator", "level": 2, "children": [{"name": "distortion", "level": 3, "children": [{"name": "BifocalDistortion", "level": 4, "size": 4461, "group": 4}, {"name": "Distortion", "level": 4, "size": 6314, "group": 4}, {"name": "FisheyeDistortion", "level": 4, "size": 3444, "group": 4}], "group": 3}, {"name": "encoder", "level": 3, "children": [{"name": "ColorEncoder", "level": 4, "size": 3179, "group": 4}, {"name": "Encoder", "level": 4, "size": 4060, "group": 4}, {"name": "PropertyEncoder", "level": 4, "size": 4138, "group": 4}, {"name": "ShapeEncoder", "level": 4, "size": 1690, "group": 4}, {"name": "SizeEncoder", "level": 4, "size": 1830, "group": 4}], "group": 3}, {"name": "filter", "level": 3, "children": [{"name": "FisheyeTreeFilter", "level": 4, "size": 5219, "group": 4}, {"name": "GraphDistanceFilter", "level": 4, "size": 3165, "group": 4}, {"name": "VisibilityFilter", "level": 4, "size": 3509, "group": 4}], "group": 3}, {"name": "IOperator", "level": 3, "size": 1286, "group": 3}, {"name": "label", "level": 3, "children": [{"name": "Labeler", "level": 4, "size": 9956, "group": 4}, {"name": "RadialLabeler", "level": 4, "size": 3899, "group": 4}, {"name": "StackedAreaLabeler", "level": 4, "size": 3202, "group": 4}], "group": 3}, {"name": "layout", "level": 3, "children": [{"name": "AxisLayout", "level": 4, "size": 6725, "group": 4}, {"name": "BundledEdgeRouter", "level": 4, "size": 3727, "group": 4}, {"name": "CircleLayout", "level": 4, "size": 9317, "group": 4}, {"name": "CirclePackingLayout", "level": 4, "size": 12003, "group": 4}, {"name": "DendrogramLayout", "level": 4, "size": 4853, "group": 4}, {"name": "ForceDirectedLayout", "level": 4, "size": 8411, "group": 4}, {"name": "IcicleTreeLayout", "level": 4, "size": 4864, "group": 4}, {"name": "IndentedTreeLayout", "level": 4, "size": 3174, "group": 4}, {"name": "Layout", "level": 4, "size": 7881, "group": 4}, {"name": "NodeLinkTreeLayout", "level": 4, "size": 12870, "group": 4}, {"name": "PieLayout", "level": 4, "size": 2728, "group": 4}, {"name": "RadialTreeLayout", "level": 4, "size": 12348, "group": 4}, {"name": "RandomLayout", "level": 4, "size": 870, "group": 4}, {"name": "StackedAreaLayout", "level": 4, "size": 9121, "group": 4}, {"name": "TreeMapLayout", "level": 4, "size": 9191, "group": 4}], "group": 3}, {"name": "Operator", "level": 3, "size": 2490, "group": 3}, {"name": "OperatorList", "level": 3, "size": 5248, "group": 3}, {"name": "OperatorSequence", "level": 3, "size": 4190, "group": 3}, {"name": "OperatorSwitch", "level": 3, "size": 2581, "group": 3}, {"name": "SortOperator", "level": 3, "size": 2023, "group": 3}], "group": 2}, {"name": "Visualization", "level": 2, "size": 16540, "group": 2}], "group": 1}], "group": 0}',

            // Display Dimensions
            HEIGHT = 1500,
            WIDTH = 1200,
            groupToDrawingProperties = [
                {
                    'shape': 'circle',
                    'color': colors.black,
                    'displayText': 'Group1'
                },
                {
                    'shape': 'circle',
                    'color': colors.blue,
                    'displayText': 'Group2'
                },
                {
                    'shape': 'circle',
                    'color': colors.orange,
                    'displayText': 'Group3'
                },
                {
                    'shape': 'circle',
                    'color': colors.green,
                    'displayText': 'Group4'
                },
                {
                    'shape': 'circle',
                    'color': colors.black,
                    'displayText': 'Group5'
                },
                {
                    'shape': 'circle',
                    'color': colors.purple,
                    'displayText': 'Group6'
                }
            ],
            links = [],

            //
            persist_left_tab_panel = true,
            left_tab_panel_enabled = true,
            left_tab_panel_displayed = true,
            heading_menu_shown = true,
            heading_pinned = true,
            mouse_on_node = false,

            // focusing and dimming
            countdown_to_focus,
            focus_active = false,
            focus_lock = false,
            // variables used by both layouts
            root,
            graph,
            legend_div,
            timeout,

            // Managers
            //force_layout,
            tree_layout_manager,
            force_layout_manager,
            nodeManager,
            linkManager,

            // Tab Managers
            GeneralTabManager = function () {
                if (!(this instanceof GeneralTabManager)) {
                    return new GeneralTabManager();
                }

                var id = '#generalTabs',
                    handle = $(id),
                    public_api = {
                        slideOut: function () {
                            handle.hide('slide', {direction: 'left'}, 500);
                        },
                        slideIn: function () {
                            handle.show('slide', {direction: 'left'}, 500);
                        },
                        showTabs: function () {
                            handle.show();
                        },
                        hideTabs: function () {
                            handle.hide();
                        },
                        getWidth: function () {
                            return handle.width();
                        },
                        showNodeLocatorTab: function () {
                            handle.tabs('option', 'active', 0);
                        },
                        showElementInfoTab: function () {
                            handle.tabs('option', 'active', 1);
                        },
                        showLegendTab: function () {
                            handle.tabs('option', 'active', 2);
                        }
                    };
                // Instantiate tabs, but hide until appropriate to use
                handle.tabs();
                public_api.showNodeLocatorTab();
                public_api.hideTabs();

                return public_api;
            },
            D3LayoutTabsManager = function () {
                if (!(this instanceof D3LayoutTabsManager)) {
                    return new D3LayoutTabsManager();
                }

                var id = '#layoutTabs',
                    handle = $(id),
                    public_api = {
                        showTabs: function () {
                            handle.show();
                        },
                        hideTabs: function () {
                            handle.hide();
                        },
                        showForceLayout: function () {
                            handle.tabs('option', 'active', 0);
                        },
                        showTreeLayout: function () {
                            handle.tabs('option', 'active', 1);
                        },
                    };
                // Instantiate tabs, but hide until appropriate to use
                handle.tabs({
                    activate: function (event, ui) {
                        d3_manager.layoutViewChange(event, ui);
                    }
                });
                public_api.showForceLayout();
                public_api.hideTabs();

                return public_api;
            },
            // Node class
            Node = function (elem) {
                if (!(this instanceof Node)) {
                    return new Node(elem);
                }
                this.name = elem.name;
                this.label = this.name;
                this.group = elem.group;
                this.level = elem.level;
                this.children = elem.children;
                this.doNotDisplay = ['children', 'allChildren', 'hiddenChildren', 'inactiveChildren', 'parent',
                    'index', 'px', 'py', 'doNotDisplay'];

                return this;
            },
            // Graph class
            Graph = function (rootNode) {
                if (!(this instanceof Graph)) {
                    return new Graph(rootNode);
                }
                this.allNodes = undefined;
                this.allNodesMap = undefined;
                this.edges = null;
                this.adjList = undefined;
                this.rootName = undefined;
                this.doNotStringify = undefined;
                this.root = undefined;
                this.init(rootNode);
            };
        Node.prototype = (function () {
            return {
                displayColors: {
                    'default': colors.dark_gray,
                    'focused': colors.red,
                    'dimmed': 'ghostwhite'
                },
                getStrokeColor: function () {
                    return this.isDimmed() === true ? this.displayColors.dimmed : this.displayColors.default;
                },
                getFillColor: function () {
                    return this.isDimmed() === true ? this.displayColors.dimmed : this.color;
                },
                getAllChildren: function () {
                    return this.allChildren;
                },
                getActiveChildren: function () {
                    return this.children;
                },
                getChildren: function () {
                    return this.children;
                },
                getInactiveChildren: function () {
                    return this.inactiveChildren;
                },
                setDrawingAttributes: function () {
                    var i,
                        children = this.getChildren() || [],
                        len = children.length,
                        group = this.group;
                    this.nodeSize = this.calculateSize();
                    this.removeFocus();
                    this.allChildren = [];
                    this.inactiveChildren = [];
                    this.hiddenChildren = [];
                    this.color = groupToDrawingProperties[group % n_groups].color;
                    this.type = groupToDrawingProperties[group % n_groups].shape;
                    for (i = 0; i < len; i += 1) {
                        this.allChildren.push(this.children[i]);
                        this.children[i].setDrawingAttributes();
                    }
                },
                appendNodesAndEdges: function (graph, parentNode) {
                    var i;
                    graph.addAssociation(parentNode, this);
                    for (i = _.size(this.children) - 1; i >= 0; i -= 1) {
                        graph = this.children[i].appendNodesAndEdges(graph, this);
                    }
                    return graph;
                },
                isFocused: function () {
                    return this.focused === true;
                },
                setFocus: function () {
                    this.focused = true;
                },
                removeFocus: function () {
                    this.focused = false;
                },
                isRoot: function () {
                    return this.group === 0;
                },
                activate: function () {
                    var i,
                        len;
                    if (this.children) {
                        for (i = 0, len = this.inactiveChildren.length; i < len; i += 1) {
                            this.children.push(this.inactiveChildren[i]);
                        }
                        for (i = 0, len = this.hiddenChildren.length; i < len; i += 1) {
                            this.children.push(this.hiddenChildren[i]);
                        }
                        this.inactiveChildren = [];
                        this.hiddenChildren = [];
                    }
                },
                deactivate: function () {
                    var i,
                        len,
                        children = this.getChildren() || [];
                    for (i = 0, len = children.length; i < len; i += 1) {
                        this.inactiveChildren.push(this.children[i]);
                    }
                    for (i = 0, len = this.hiddenChildren.length; i < len; i += 1) {
                        this.inactiveChildren.push(this.hiddenChildren[i]);
                    }
                    this.hiddenChildren = [];
                    this.children = [];
                },
                activateSelfAndDescendants: function () {
                    var i,
                        len;
                    for (i = 0, len = this.allChildren.length; i < len; i += 1) {
                        this.allChildren[i].activateSelfAndDescendants();
                    }
                    this.activate();
                },
                deactivateSelfAndDescendants: function () {
                    var i,
                        len;
                    for (i = 0, len = this.allChildren.length; i < len; i += 1) {
                        this.allChildren[i].deactivateSelfAndDescendants();
                    }
                    this.deactivate();
                },
                hasChildren: function () {
                    return this.children && this.children.length > 0;
                },
                isDimmed: function () {
                    return focus_active === true && !this.isFocused();
                },
                calculateSize: function () {

                    function recurse(that, node, runningSize) {
                        var i,
                            len;
                        // Recursively increase the node's size when the node has children
                        if (node.hasChildren()) {
                            runningSize += 3; // Increase size for every descendant of the parent node
                            for (i = 0, len = node.children.length; i < len; i += 1) {
                                runningSize = recurse(that, node.children[i], runningSize);
                            }
                        }
                        // Delimiting case for recursive calculation is not taking if branch
                        return runningSize;
                    }

                    var that = this;
                    return this.isRoot() === true ? 10 : recurse(that, this, 3);
                },
                toggle: function () {
                    if (this.hasChildren()) {
                        // Hide all descendants
                        this.deactivateSelfAndDescendants();
                    } else {
                        // Show children
                        this.activate();
                    }
                },
                assertUnfocusedChildrenHidden: function () {
                    var i,
                        len;
                    if (this.hasChildren()) {
                        // Set all children to hidden, and only display focused children
                        this.hiddenChildren = [];
                        this.children = [];
                        // Add back focused nodes to be displayed
                        for (i = 0, len = this.allChildren.length; i < len; i += 1) {
                            if (this.allChildren[i].isFocused()) {
                                // Add to children array to be displayed
                                this.children.push(this.allChildren[i]);
                            } else {
                                // Add to hidden children array to not be displayed
                                this.hiddenChildren.push(this.allChildren[i]);
                            }
                        }
                    }
                }
            };
        }());
        Graph.prototype = (function () {
            // insert any private members here

            // return prototype methods
            return {
                init: function (rootNode) {
                    this.allNodes = [];
                    this.allNodesMap = {};
                    // maintain an edge list to pass to a D3 force layout constructor
                    //   in order to avoid duplicate nodes
                    this.edges = [];
                    this.edges.length = 0;
                    // Map to a map of nodes keyed by their names
                    // Pseudo-code: adjList[key] = <node name : node> map
                    this.adjList = [];
                    // Create a root node (for tree-like behavior)
                    console.log(rootNode);
                    this.rootName = rootNode.label;
                    // Collection of properties to not convert to JSON when JSON.stringify() is called
                    this.doNotStringify = {children: true};

                    this.root = rootNode;
                    this.assertMapping(rootNode.label);
                    this.allNodesMap[rootNode.label] = rootNode;
                    this.allNodes.push(this.allNodesMap[rootNode.label]);
                },
                setNodeSizes: function (node) {
                    var i,
                        children = node.getChildren() || [],
                        len = children.length;
                    node.nodeSize = 1;
                    for (i = 0; i < len; i += 1) {
                        this.setNodeSizes(node.children[i]);
                    }
                },
                getNumNodes: function () {
                    return _.size(this.allNodes);
                },
                contains: function (nodeKey) {
                    return (this.allNodesMap[nodeKey] !== undefined);
                },
                assertMapping: function (key) {
                    // Assert that adjList[key] is defined,
                    //  so that it may be indexed and set
                    if (!this.adjList[key]) {
                        this.adjList[key] = {};
                    }
                },
                addAssociation: function (parent_node, child_node) {
                    var parent_name = parent_node.name,
                        child_name = child_node.label,
                        i;

                    if (!this.contains(parent_node.name)) {
                        throw "Attempted to add a node with an undefined parent!\n" +
                        "Parent Node: " + parent_name + "\nNode: " + child_name;
                    }

                    //console.log("=======================================");
                    // Add the node to the graph if not previously added
                    if (!this.allNodesMap[child_name]) {
                        // add mapping for node
                        this.allNodesMap[child_name] = child_node;
                        this.assertMapping(child_name);
                        // add the node to allNodes (both the map and list)
                        this.allNodes.push(child_node);
                        //console.log('Creating node for ' + child.label);
                        this.allNodesMap[child_name] = child_node;
                    }
                    /*else {
                     // Element already exists in the graph. Reassign the child of the parent node
                     // to the existing node in the graph
                     for (i = 0; i < _.size(parent_node.children); i += 1) {
                     if (parent_node.children[i].label === child_name) {
                     //console.log('Reassigned ' + parent_name + ' -> ' + child_node.name);
                     parent_node.children[i] = this.allNodesMap[child_name];
                     //var removed = parent_node.children.splice(i, 1);
                     //console.log(removed);
                     }
                     }
                     }
                     */

                    // Add mapping in the adjacency and edge lists
                    this.assertMapping(parent_name);
                    if (!this.adjList[parent_name][child_name]) {
                        // Add adjacency list mapping
                        this.adjList[parent_name][child_name] = this.allNodesMap[child_name];
                        // Add to edge list
                        /*if (this.allNodesMap[child_name].name === 'EMT02') {
                         console.log('=======');
                         console.log(this.allNodesMap[parent_name]);
                         console.log(this.allNodesMap[child_name]);
                         }*/
                        this.addEdge(this.allNodesMap[parent_name], this.allNodesMap[child_name], child_node.properties);
                    }
                },
                addEdge: function (source, target, properties) {
                    if (source === undefined || target === undefined) {
                        throw "Cannot create graph edge! Passed in undefined reference to an element!";
                    }
                    this.edges.push({
                        'source': source,
                        'target': target,
                        'properties': properties
                    });
                },
                appendJSON: function (json, node, doNotStringify) {
                    var result, key;
                    if (json.length > 0) json += ', ';
                    //json += JSON.stringify(node, null, 1);
                    json += JSON.stringify(node, function (key, value) {
                            result = value;
                            if (key === 'children') {
                                result = (value.length > 0 ? _.pluck(value, 'name') : []);
                            }
                            return result;
                        }, 4
                    );
                    var children = this.adjList[node.name];
                    if (_.size(children) > 0) {
                        for (key in children) {
                            if (children.hasOwnProperty(key)) {
                                json = this.appendJSON(json, children[key], doNotStringify);
                            }
                        }
                    }
                    return json;
                }
            };
        }());

        // Node Manager class
        var NodeManager = function (root) {
                if (!(this instanceof NodeManager)) {
                    return new NodeManager(root);
                }

                // private members
                var rootNode = root;

                // return public API
                return {
                    setDrawingAttributes: function () {
                        // recursively sets drawing attributes for all nodes, starting with the root
                        rootNode.setDrawingAttributes();
                    },
                    hideUnfocusedNodes: function () {
                        function recurse(node) {
                            var i,
                                len;
                            if (!node.isFocused()) {
                                node.deactivate();
                            } else {
                                node.assertUnfocusedChildrenHidden();
                            }
                            // Recursively loop through children
                            for (i = 0, len = node.allChildren.length; i < len; i += 1) {
                                recurse(node.allChildren[i]);
                            }
                        }

                        recurse(rootNode);
                    },
                    showAllNodes: function () {
                        function recurse(that, node) {
                            var i, len;
                            if (node.isFocused()) {
                                node.removeFocus();
                            }
                            node.activate();

                            // Recursively loop through children
                            //env.util.consoleMessage(node.name, node);
                            for (i = 0, len = node.allChildren.length; i < len; i += 1) {
                                recurse(that, node.allChildren[i]);
                            }
                        }

                        // Call to recursive inner function
                        recurse(this, rootNode);
                    },
                    getAllNodesWithName: function (name) {
                        function recurse(node, name, nodesWithName) {
                            var i, len;
                            // Add the current node to the collection if it has the desired name
                            if (name === node.name.toLowerCase()) {
                                nodesWithName.push(node);
                            }
                            // Recurse through children
                            for (i = 0, len = node.allChildren.length; i < len; i += 1) {
                                recurse(node.allChildren[i], name, nodesWithName);
                            }
                        }

                        name = name.toLowerCase();
                        var nodesWithName = [];
                        recurse(rootNode, name, nodesWithName);
                        return nodesWithName;
                    },
                    getAllElementNames: function () {
                        function recurse(node, allNames) {
                            var i,
                                allChildren = node.getAllChildren(),
                                len = allChildren.length;
                            allNames.push(node.name);
                            for (i = 0; i < len; i += 1) {
                                recurse(allChildren[i], allNames);
                            }
                        }

                        var allNames = [];
                        recurse(rootNode, allNames);
                        return allNames;
                    },
                    createMapByGroup: function () {
                        function recurse(newRoot, node) {
                            var i,
                                len;
                            // Add node to appropriate group, based on type
                            for (i = 0, len = newRoot.allChildren.length; i < len; i += 1) {
                                if (node.group === newRoot.allChildren[i].name) {
                                    newRoot.allChildren[i].allChildren.push(node);
                                }
                            }
                            // Recurse through children
                            for (i = 0, len = node.allChildren.length; i < len; i += 1) {
                                recurse(newRoot, node.allChildren[i]);
                            }
                        }

                        var i,
                            len,
                            key,
                            newRoot = {};
                        for (key in rootNode) {
                            newRoot[key] = root[key];
                        }
                        newRoot.children = [];
                        newRoot.allChildren = [];
                        newRoot.hiddenChildren = [];

                        // Assign node for each element type
                        for (i = 0, len = nodeGroups.length; i < len; i += 1) {
                            if (nodeGroups[i] !== 'none' && nodeGroups[i] !== 'Root') {
                                newRoot.allChildren.push({
                                    name: nodeGroups[i],
                                    allChildren: []
                                });
                            }
                        }
                        recurse(newRoot, rootNode);
                        return newRoot;
                    },
                    flattenNodes: function () {
                        var nodes = [],
                            i = 0;

                        function recurse(node) {
                            if (node.children && node.children.length > 0) node.size = node.children.reduce(function (p, v) {
                                return p + recurse(v);
                            }, 0);
                            if (!node.id) node.id = i += 1;
                            nodes.push(node);
                            return node.size;
                        }

                        root.size = recurse(rootNode);
                        return nodes;
                    },
                    disableFocusAndLock: function () {
                        focus_lock = false;
                        focus_active = false;
                    },
                    enableFocusAndLock: function () {
                        focus_lock = true;
                        focus_active = true;
                    },
                    hasDescendant: function (start_node, comparisonFunc) {

                        function recurse(start_node, comparisonFunc) {
                            var i,
                                len;
                            // Beginning with the start_node, determine if either the start_node or any descendant
                            // of the start node has the desired functionality/characteristics defined by the comparisonFunc
                            if (comparisonFunc(start_node)) {
                                // This is a desired node. Go ahead and return true
                                return true;
                            } else {
                                // Search the descendants of this node for a desired node
                                for (i = 0, len = start_node.allChildren.length; i < len; i += 1) {
                                    if (recurse(start_node.allChildren[i], comparisonFunc)) {
                                        return true;
                                    }
                                }
                            }
                            // Return false if no desired descendant is found
                            return false;
                        }

                        return recurse(start_node, comparisonFunc);
                    }
                };
            },
            // Link Manager class
            LinkManager = function (links) {
                if (!(this instanceof LinkManager)) {
                    return new LinkManager(links);
                }

                var myLinks = links,
                    linkDisplayColors = {
                        'default': colors.dark_gray,
                        'focused': colors.red,
                        'dimmed': 'ghostwhite'
                    },
                    LINK_WIDTHS = {
                        'focused': 4,
                        'default': 1
                    },
                    public_api = {
                        getLinkColor: function (link) {
                            if (focus_active === true) {
                                return link.target.isFocused() ? linkDisplayColors['focused'] : linkDisplayColors['dimmed'];
                            } else {
                                return link.target.isFocused() ? linkDisplayColors['focused'] : linkDisplayColors['default'];
                            }
                        },
                        liveLinks: function () {
                            var i, len, liveLinks = [];
                            for (i = 0, len = myLinks.length; i < len; i += 1) {
                                if (myLinks[i].source.children && _.contains(myLinks[i].source.children, myLinks[i].target)) {
                                    liveLinks.push(myLinks[i]);
                                }
                            }
                            return liveLinks;
                        },
                        getWidth: function (link) {
                            return link.target.isFocused() ? LINK_WIDTHS['focused'] : LINK_WIDTHS['default'];
                        }
                    };

                return public_api;
            },
            // DOM Manager class
            DomManager = function () {
                if (!(this instanceof DomManager)) {
                    return new DomManager();
                }

                var nodeGroupselectMenuId = 'groupSelect',
                    nodeGroupselectMenuIdHandle = '#' + nodeGroupselectMenuId,
                    nodeGroupselectMenu = $(nodeGroupselectMenuIdHandle),
                    node_information = d3.select('.d3-node-info'),
                    heading_pin = d3.select('#headingPinButton'),
                    public_api = {
                        createLegend: function () {
                            var i,
                                len,
                                svg;
                            legend_div = d3.select('#groupLegendDiv');
                            var newRow;

                            // Legend for Element types
                            var elementTable = legend_div.append('table')
                                .attr('class', 'legendTable');

                            // Header row
                            elementTable.append('tr').append('th')
                                .attr('colspan', '2')
                                .style('font-size', '18px')
                                .html('Element Type Legend');

                            // Create entry for each element type
                            for (i = 0, len = nodeGroups.length; i < len; i += 1) {
                                if (nodeGroups[i] !== 'None') {
                                    newRow = elementTable.append('tr');
                                    var svg = newRow.append('td').append("svg")
                                        .attr('width', 20)
                                        .attr('height', 20);
                                    svg.append('path')
                                        .attr('x', 100)
                                        .attr('y', 100)
                                        .attr('transform', function (d) {
                                            return "translate(" + 10 + "," + 10 + ")";
                                        })
                                        .attr("d", d3.svg.symbol()
                                            .size(100)
                                            .type(function () {
                                                return groupToDrawingProperties[nodeGroups[i] % n_groups]['shape'];
                                            }))
                                        .style('fill', function () {
                                            return groupToDrawingProperties[nodeGroups[i] % n_groups]['color']
                                        });
                                    newRow.append('td')
                                        .html('<strong>' + nodeGroups[i] + '</strong>');
                                }
                            }

                            //showHTMLId('legend');
                            $('#legend').show();
                        },
                        clearHighlightedPaths: function () {
                            nodeManager.showAllNodes();
                            public_api.selectAllNodes();
                            public_api.showDefaultDisplay();
                        },
                        clearnodeGroupselectMenu: function () {
                            nodeGroupselectMenu.prop('value', '');
                        },
                        groupSelectionChange: function () {
                            var group = parseInt(nodeGroupselectMenu.prop('value'));
                            dom_manager.showGroup(root, group, true);
                            d3_manager.updateActiveLayout();
                        },
                        headingPinClick: function () {
                            if (heading_pinned === true) {
                                // Unpin and change color to indicate lack of pinning
                                heading_pinned = false;
                                heading_pin.attr('class', 'btn btn-danger');
                            } else {
                                // Pin and change color to indicate lack of pinning
                                heading_pinned = true;
                                heading_pin.attr('class', 'btn btn-success');
                            }
                        },
                        hideHeadingMenu: function () {
                            $('.heading').slideUp('fast');
                            heading_menu_shown = false;
                            // Show an indicator message so the user knows how to re-display the menu
                            d3.select('.headingIndicatorMessage').append('p')
                                .attr('id', 'headingIndicatorMessage')
                                .text('^^^ Hover Mouse to Show Heading ^^^')
                        },
                        hideLeftTabPanel: function () {
                            general_tab_manager.slideOut();
                            left_tab_panel_displayed = false;
                            //Show an indicator message so the user knows how to re-display the menu
                            d3.select('.showLeftTabPanelMessage').append('p')
                                .attr('id', 'showLeftTabPanelMessage')
                                .text('^^^ Hover Mouse to Show Node Information Menu ^^^')
                            $('.showLeftTabPanelMessage').show();
                        },
                        highlightPathsTo: function (name) {

                            function recurse(node, name, found_node, node_that_was_found) {
                                var i, len, result;
                                // Reuse node.focused property as the flag for finding the node
                                node.removeFocus();
                                // Recursively loop through children. Always loop through children so that the entire tree
                                // is visited and correctly focused/unfocused. If you were to only visit children if the node
                                // was not found, then the recursion would stop at the found node, and its descendants would not
                                // be correctly focused/unfocused
                                for (i = 0, len = node.allChildren.length; i < len; i += 1) {
                                    result = recurse(node.allChildren[i], name, found_node, node_that_was_found);
                                    found_node = result.found;
                                    node_that_was_found = result.node;
                                    // If child of this node is focused, this node should also be focused.
                                    // This creates the highlighted path from the root to the actual node of interest,
                                    if (result.focused === true) {
                                        node.setFocus();
                                    }
                                }

                                // Check for node found
                                // Originally was string equality check, changed to substring check for search
                                if (node.name.toLowerCase().search(name) > -1) {
                                    // Found node. Set focused and chain-return true up the recursive stack
                                    node.setFocus();
                                    found_node = true;
                                    console.log('Found');
                                    console.log(node);
                                    node_that_was_found = node;
                                }
                                // Return DTO with fields for the node being focused, and whether
                                // the desired node was found
                                return {
                                    'focused': node.focused,
                                    'found': found_node,
                                    'node': node_that_was_found
                                };
                            }

                            var result = recurse(root, name.toLowerCase(), false, {});

                            return result.found;
                        },
                        leftTabPanelPinClick: function () {
                            if (persist_left_tab_panel === true) {
                                // Unpin and change color to indicate lack of pinning
                                persist_left_tab_panel = false;
                                d3.select('#leftTabPanelPinButton').attr('class', 'btn btn-danger');
                            } else {
                                // Pin and change color to indicate lack of pinning
                                persist_left_tab_panel = true;
                                d3.select('#leftTabPanelPinButton').attr('class', 'btn btn-success');
                            }
                        },
                        populateGroupFilterMenus: function () {
                            var i, len, groupOptGroup;

                            // Clear existing options
                            nodeGroupselectMenu.find('option').remove();
                            nodeGroupselectMenu.find('optgroup').remove();

                            // Options for filtering by element type
                            groupOptGroup = d3.select('#groupSelect').append('optgroup')
                                .attr('label', 'Element Type');
                            // Option to revert to viewing all elements
                            groupOptGroup.append('option')
                                .attr('value', 'all')
                                .html('All');
                            for (i = 0, len = n_groups; i < len; i += 1) {
                                groupOptGroup.append('option')
                                    .attr('value', nodeGroups[i])
                                    .html(nodeGroups[i]);
                            }
                        },
                        selectAllNodes: function () {
                            nodeGroupselectMenu.val('all');
                            d3_manager.updateActiveLayout();
                        },
                        showDefaultDisplay: function () {
                            $('#groupSelect').val('0');
                            d3_manager.updateActiveLayout();
                        },
                        showGroup: function (node, maxLevelToClick, removeFocus) {
                            var i, len;
                            // regardless of level or node, disable the focus property if instructed to
                            if (removeFocus === true) {
                                node.removeFocus();
                            }

                            // if node.level < group leve num, activateNode
                            // if node.level >= group level num, deactivateNode
                            if (node.level >= maxLevelToClick) {
                                node.deactivate();
                            } else {
                                node.activate();
                            }

                            // Recursively loop through children
                            for (i = 0, len = node.allChildren.length; i < len; i += 1) {
                                this.showGroup(node.allChildren[i], maxLevelToClick, removeFocus);
                            }
                        },
                        showHeadingMenu: function () {
                            $('.heading').slideDown('fast');
                            heading_menu_shown = true;
                            // Remove the re-display message indicator
                            d3.select('#headingIndicatorMessage').remove();
                        },
                        showLeftTabPanel: function () {
                            general_tab_manager.slideIn();
                            left_tab_panel_displayed = true;
                            // Remove the re-display message indicator
                            d3.select('#showLeftTabPanelMessage').remove();
                        },
                        showNodeInformation: function (node) {
                            var newRow, info, nodeTypeTable, nodeType, svg, propertiesTable,
                                key, i, len;

                            // Remove default message if it is currently displayed
                            d3.select('#defaultNodeInfoMessage').remove();

                            // Remove previous information displayed and reset
                            node_information.select('info').remove();
                            info = node_information.append('info')
                                .attr('class', 'info_display');

                            // Display type of element being displayed
                            info.append('h2').attr('class', 'nodeInfoTitle')
                                .html(node.group);

                            // Show element name and display example node
                            nodeTypeTable = info.append('table')
                                .style({
                                    'margin-left': 'auto',
                                    'margin-right': 'auto'
                                });
                            nodeTypeTable.append('tr');
                            nodeType = nodeTypeTable.append('td').append('h1')
                                .attr('class', 'nodeInfoTitle')
                                .html(node.name);
                            svg = nodeTypeTable.append('td').append("svg")
                                .attr('width', 30)
                                .attr('height', 20);
                            svg.append('circle')
                                .attr('cx', 20)
                                .attr('cy', 10)
                                .attr('r', 10)
                                .style('fill', function () {
                                    return node.getFillColor();
                                });

                            // Create the main properties table, which displays
                            // all singular (not an array) data.
                            propertiesTable = info.append('table')
                                .attr('class', 'propertiesTable');
                            propertiesTable.append('tr').append('th')
                                .attr('colspan', '2')
                                .attr('class', 'nodeInfoTitle')
                                .html('Properties for ' + node.name + ' (' + node.group + ')');

                            // Display all data in the 'properties' field of the object
                            //var mainList = info.append('ul');
                            for (key in node) {
                                if (node.hasOwnProperty(key) && !_.isFunction(node[key]) &&
                                    !_.contains(node.doNotDisplay, key)) {
                                    // Append a new table if the data is an array
                                    if (_.isArray(node[key])) {
                                        propertiesTable.append('tr').append('th')
                                            .attr('rowspan', (node[key].length + 1).toString())
                                            .html(key);
                                        for (i = 0, len = node[key].length; i < len; i += 1) {
                                            propertiesTable.append('tr').append('td')
                                                .html(node[key][i]);
                                        }
                                    } else {
                                        // This is just singular data. However, if the text is
                                        //   large (i.e. is response routine code) display it outside
                                        //   of the table
                                        if (node[key].length > 30) {
                                            info.append('p')
                                                .attr('class', 'nodeInfoTitle')
                                                .style('padding-top', '50px')
                                                .html('Routine Implementation');
                                            info.append('p')
                                                .attr('class', 'code')
                                                .html(node[key]);
                                        } else {
                                            newRow = propertiesTable.append('tr');
                                            newRow.append('td')
                                                .html('<strong>' + key + ': </strong>');
                                            newRow.append('td')
                                                .html(node[key]);
                                        }
                                    }
                                }
                            }

                            general_tab_manager.showTabs();
                        },
                        showOnlyPathsToElement: function (name) {
                            var found, i, len;
                            public_api.clearnodeGroupselectMenu();
                            root.activateSelfAndDescendants();
                            found = dom_manager.highlightPathsTo(name);
                            if (found === true) {
                                nodeManager.hideUnfocusedNodes();
                                var nodesWithName = nodeManager.getAllNodesWithName(name);
                                for (i = 0, len = nodesWithName.length; i < len; i += 1) {
                                    nodesWithName[i].deactivate();
                                }
                                return true;
                            }
                            return false;
                        },
                        showOnlySelectedNodes: function (desired_nodes, removeFocus) {

                            function recurse(node) {
                                var i,
                                    len,
                                    show_node;

                                // Regardless of level or node, disable the focus property if desired
                                if (removeFocus === true) {
                                    node.removeFocus();
                                }

                                // Determine custom determination of a desired node, and pass to the node manager
                                // to determine
                                show_node = nodeManager.hasDescendant(node, function (cur_node) {
                                    return _.contains(desired_nodes, cur_node.name);
                                });

                                if (show_node) {
                                    node.setFocus();
                                } else {
                                    node.removeFocus();
                                }

                                // Recursively loop through children
                                for (i = 0, len = node.allChildren.length; i < len; i += 1) {
                                    recurse(node.allChildren[i]);
                                }
                            }

                            recurse(root);
                            nodeManager.hideUnfocusedNodes();
                            d3_manager.updateActiveLayout();
                        },
                        showPathsTo: function (desired_node, removeFocus) {

                            function recurse(node) {
                                var i,
                                    len,
                                    show_node;

                                // Regardless of level or node, disable the focus property if desired
                                if (removeFocus === true) {
                                    node.removeFocus();
                                }

                                // Determine custom determination of a desired node, and pass to the node manager
                                // to determine
                                show_node = nodeManager.hasDescendant(node, function (cur_node) {
                                    return _.contains(desired_node, cur_node.name);
                                });

                                if (show_node) {
                                    node.setFocus();
                                } else {
                                    node.removeFocus();
                                }

                                // Recursively loop through children
                                for (i = 0, len = node.allChildren.length; i < len; i += 1) {
                                    recurse(node.allChildren[i]);
                                }
                            }

                            recurse(root);
                            nodeManager.hideUnfocusedNodes();
                            d3_manager.updateActiveLayout();
                        }
                    };

                // Misc initialization of HTML elements
                node_information.append('info')
                    .attr('class', 'info_display');

                // Set event listeners
                nodeGroupselectMenu.change(public_api.groupSelectionChange);
                $('#file_input').change(onFileLoad); // loading file
                $('#headingPinButton').click(public_api.headingPinClick); // pin for showing/hiding the header panel
                // Event listener for processing search when enter key is hit
                $('#searchInput').keypress(function (e) {
                    if (e.keyCode === 13) {
                        search($('#searchInput').val());
                    }
                });
                // Hide the unpin button for the left tab until the two tab displays can be correctly aligned without using fixed css position
                $('#leftTabPanelPinButton').hide();
                // Generate accordion for nodeLocateTab
                $('#nodeLocateAccordion')
                    .accordion({
                        active: 1,
                        header: '> div > h3',
                        heightStyle: 'content',
                        collapsible: true
                    })
                    .sortable({
                        axis: 'y',
                        handle: 'h3',
                        stop: function (event, ui) {
                            ui.item.children('h3').triggerHandler('focusout');
                            $(this).accordion('refresh');
                        }
                    });

                return public_api;
            },
            // D3 Manager
            D3Manager = function () {
                if (!(this instanceof D3Manager)) {
                    return new D3Manager();
                }

                var layout_managers = [],
                    active_layout,
                    nodeContextMenu = function () {
                        var menus = [];

                        // Menus related to highlighting, displaying, and focus of the nodes
                        if (focus_lock === true) {
                            menus.push(
                                {
                                    'title': 'Only show paths to this element',
                                    action: function () {
                                        dom_manager.clearnodeGroupselectMenu();
                                        root.activateSelfAndDescendants();
                                        nodeManager.hideUnfocusedNodes();
                                        d3_manager.updateActiveLayout();
                                    }
                                }
                            );
                            menus.push(
                                {
                                    'title': 'Remove focus',
                                    action: function () {
                                        nodeManager.disableFocusAndLock();
                                        d3_manager.updateActiveLayout();
                                    }
                                }
                            );
                        } else {
                            menus.push(
                                {
                                    'title': 'Highlight paths to this element',
                                    action: function (elm, d) {
                                        // pass the name so that multiple nodes with the same name get highlighted
                                        dom_manager.highlightPathsTo(d.name);
                                        d3_manager.updateActiveLayout();
                                    }
                                }
                            );
                            menus.push(
                                {
                                    'title': 'Only show paths to this element',
                                    action: function (elm, d) {
                                        dom_manager.showOnlyPathsToElement(d.name);
                                        d3_manager.updateActiveLayout();
                                    }
                                }
                            );
                            menus.push(
                                {
                                    'title': 'Apply focus to element',
                                    action: function (elm, d) {
                                        dom_manager.showOnlyPathsToElement(d.name);
                                        nodeManager.enableFocusAndLock();
                                        d3_manager.updateActiveLayout();
                                    }
                                }
                            );
                        }

                        //// Pin/unpin node left panel
                        //if (persist_left_tab_panel === true) {
                        //    // Allow option to unpin the left panel, so that
                        //    // the panel disappears when the user's mouse leaves the node
                        //    menus.push(
                        //        {
                        //            'title': 'Unpin left panel',
                        //            action: function () {
                        //                persist_left_tab_panel = false;
                        //                general_tab_manager.hideTabs();
                        //            }
                        //        }
                        //    );
                        //} else {
                        //    // Allow option to pin the left panel, so that
                        //    // the panel does not disappear when the user's mouse leaves the node
                        //    menus.push(
                        //        {
                        //            'title': 'Pin left panel',
                        //            action: function () {
                        //                persist_left_tab_panel = true;
                        //            }
                        //        }
                        //    );
                        //}

                        return menus;
                    },
                    contextMenu = function () {
                        var menus = [];

                        // Menus related to highlighting, displaying, and focus of the nodes
                        if (focus_lock === true) {
                            menus.push(
                                {
                                    'title': 'Reset View',
                                    action: function () {
                                        nodeManager.showAllNodes();
                                        nodeManager.disableFocusAndLock();
                                        d3_manager.updateActiveLayout();
                                    }
                                }
                            );
                            menus.push(
                                {
                                    'title': 'Remove focus',
                                    action: function (elm, d) {
                                        nodeManager.disableFocusAndLock();
                                        d3_manager.updateActiveLayout();
                                    }
                                }
                            );
                        } else {
                            menus.push(
                                {
                                    'title': 'Clear highlighted paths',
                                    action: function () {
                                        // Clear the search input
                                        $('#searchInput').val('');
                                        // Remove focus from all nodes (clears highlighted path)
                                        dom_manager.clearHighlightedPaths();
                                        d3_manager.updateActiveLayout();
                                    }
                                }
                            );
                        }

                        //// Enable/disable node info panel menus
                        //if (left_tab_panel_enabled) {
                        //    // Show option to disable node info panel
                        //    menus.push(
                        //        {
                        //            'title': 'Disable left panel',
                        //            action: function () {
                        //                left_tab_panel_enabled = false;
                        //                left_tab_panel_displayed = false;
                        //                persist_left_tab_panel = false;
                        //                general_tab_manager.hideTabs();
                        //            }
                        //        }
                        //    );
                        //
                        //
                        //    if (left_tab_panel_displayed) {
                        //        // Show option to hide the node info panel
                        //        menus.push(
                        //            {
                        //                'title': 'Hide left panel',
                        //                action: function () {
                        //                    general_tab_manager.hideTabs();
                        //                    left_tab_panel_displayed = false;
                        //                }
                        //            }
                        //        );
                        //    }
                        //
                        //    // Pin/unpin node info panel menus
                        //    if (persist_left_tab_panel === true) {
                        //        // Allow option to unpin the left panel, so that
                        //        // the panel disappears when the user's mouse leaves the node
                        //        menus.push(
                        //            {
                        //                'title': 'Unpin left panel',
                        //                action: function () {
                        //                    persist_left_tab_panel = false;
                        //                }
                        //            }
                        //        );
                        //    } else {
                        //        // Allow option to pin the left panel, so that
                        //        // the panel does not disappear when the user's mouse leaves the node
                        //        menus.push(
                        //            {
                        //                'title': 'Pin left panel',
                        //                action: function () {
                        //                    persist_left_tab_panel = true;
                        //                }
                        //            }
                        //        );
                        //    }
                        //} else {
                        //    // Show option to enable node info panel
                        //    menus.push(
                        //        {
                        //            'title': 'Enable left panel',
                        //            action: function () {
                        //                left_tab_panel_enabled = true;
                        //            }
                        //        }
                        //    );
                        //}

                        return menus;
                    },
                    public_api = {
                        // D3 tooltip to display the node name on mouse-over
                        tip: d3.tip()
                            .attr('class', 'd3-tip')
                            .html(function (d) {
                                return "<strong>Name: </strong><span>" + d.name + "</span>";
                            }),
                        zoomView: function () {
                            active_layout.zoom();
                        },
                        setActiveLayout: function (new_layout) {
                            active_layout = new_layout;
                        },
                        getActiveLayout: function () {
                            return active_layout;
                        },
                        updateActiveLayout: function () {
                            active_layout.update();
                        },
                        updateAllLayouts: function () {
                            layout_managers.forEach(function (layout) {
                                layout.update();
                            });
                        },
                        layoutViewChange: function (event, ui) {
                            var tabIndex = ui.newTab.index();
                            active_layout = layout_managers[tabIndex];
                            active_layout.update();
                        },
                        addLayoutManager: function (new_manager) {
                            // Add the new layout manager to the collection
                            layout_managers.push(new_manager);

                            // Set the active layout if first addition
                            if (_.size(layout_managers) === 1) {
                                active_layout = layout_managers[0];
                            }

                            // Apply context menus and zoom behavior to the svg
                            d3.select(new_manager.getHtmlId())
                                .on('contextmenu', d3.contextMenu(d3_manager.getContextMenu()))
                                .call(d3.behavior.zoom().on('zoom', d3_manager.zoomView))
                                .on("dblclick.zoom", null);
                        },
                        getNodeContextMenu: function () {
                            return nodeContextMenu;
                        },
                        getContextMenu: function () {
                            return contextMenu;
                        }
                    };

                return public_api;
            },
            // Force-directed graph constructors
            ForceLayout = function (force, svg) {
                if (!(this instanceof ForceLayout)) {
                    return new ForceLayout(force, svg);
                }

                var myForce = force,
                    mySvg = svg,
                    node,
                    link,
                    public_api = {
                        update: function () {
                            var nodes = nodeManager.flattenNodes(),
                                liveLinks = linkManager.liveLinks(),
                                start_time = new Date().getTime();

                            //console.log(flare_JSON);
                            //flare_JSON.fixed = true
                            //flare_JSON.x = 1280 / 2;
                            //flare_JSON.y = 800/2 - 80;
                            //var nodes  = nodeManager.flattenNodes();
                            //var liveLinks = d3.layout.tree().links(nodes);
                            //console.log(liveLinks);

                            // Set root of layout to be in middle of screen
                            // Tree layout root is set to the left, since the tree grows to the right
                            root.x = WIDTH / 2;
                            root.y = HEIGHT / 2;

                            // Links cannot be chosen dynamically by d3.layout.tree().links(nodes).
                            //   Using this, a links will not be created for nodes with multiple
                            //   incoming links (i.e. we are really working with a graph, and need
                            //   to supply custom links)
                            myForce
                                .nodes(nodes)
                                .links(liveLinks)
                                .start();

                            // Update the links…
                            link = mySvg.selectAll("line.link")
                                .data(liveLinks, function (d) {
                                    return d.target.id;
                                })
                                .style({
                                    "stroke": function (d) {
                                        return linkManager.getLinkColor(d);
                                    },
                                    "stroke-width": function (d) {
                                        return linkManager.getWidth(d);
                                    }
                                });

                            // Enter any new links.
                            link.enter().insert("svg:line", ".node")
                                .attr("class", "link")
                                .attr("x1", function (d) {
                                    return d.source.x;
                                })
                                .attr("y1", function (d) {
                                    return d.source.y;
                                })
                                .attr("x2", function (d) {
                                    return d.target.x;
                                })
                                .attr("y2", function (d) {
                                    return d.target.y;
                                })
                                .style({
                                    "stroke": function (d) {
                                        return linkManager.getLinkColor(d);
                                    },
                                    "stroke-width": function (d) {
                                        return linkManager.getWidth(d);
                                    }
                                });

                            // Exit any old links.
                            link.exit().remove();

                            // Get handle on all nodes
                            node = mySvg.selectAll(".node")
                                .data(nodes, function (d) {
                                    return d.id;
                                });

                            // Update existing nodes
                            node.transition()
                                .attr('d', d3.svg.symbol()
                                    .size(function (d) {
                                        return d.nodeSize * 50;
                                    })
                                    .type(function (d) {
                                        return d.type;
                                    }))
                                .style("fill", function (d) {
                                    return d.getFillColor();
                                })
                                .style("stroke", function (d) {
                                    return d.getStrokeColor()
                                });

                            // Enter any new nodes.
                            node.enter().append("path")
                                .attr("class", "node")
                                .attr("d", d3.svg.symbol()
                                    .size(function (d) {
                                        return d.nodeSize * 50;
                                    })
                                    .type(function (d) {
                                        return d.type;
                                    }))
                                .attr("cx", function (d) {
                                    return d.x;
                                })
                                .attr("cy", function (d) {
                                    return d.y;
                                })
                                .style("fill", function (d) {
                                    return d.color;
                                })
                                .on('contextmenu', d3.contextMenu(d3_manager.getNodeContextMenu())) // attach context menu to new node;
                                .on("click", function (d) {
                                    if (left_tab_panel_enabled === true) {
                                        // Show the element's information in the 'Element Info' tab, and show that tab
                                        dom_manager.showNodeInformation(d);
                                        general_tab_manager.showElementInfoTab();
                                        left_tab_panel_displayed = true;
                                    }
                                })
                                .on("dblclick", function (d) {
                                    if (focus_lock === false) {
                                        dom_manager.clearnodeGroupselectMenu();
                                        d.toggle();
                                        public_api.update();
                                    }
                                })
                                .on('mouseenter', function (d) {
                                    // Only change focus is there is no current focus lock set by the user
                                    if (focus_lock === false) {
                                        d3_manager.tip.show(d);

                                        //dom_manager.highlightPathsTo(d.name); // pass the name so that multiple nodes with the same name get highlighted
                                        //countdown_to_focus = setTimeout(function () {
                                        //focus_active = true;
                                        //dom_manager.highlightPathsTo(d.name);
                                        //public_api.update();
                                        //}, 1000);

                                        //public_api.update();
                                        //setTimeout(public_api.update, 2000);
                                    }
                                })
                                .on('mouseleave', function () {
                                    if (focus_lock === false) {
                                        focus_active = false;
                                        d3_manager.tip.hide();
                                        if (persist_left_tab_panel === false) {
                                            general_tab_manager.hideTabs()
                                        }

                                        // Only remove the focus if it has not been locked by the user
                                        //clearTimeout(countdown_to_focus);
                                        //timeout = setTimeout(public_api.update, 2000);
                                    }
                                });
                            //.call(myForce.drag);

                            // Exit any old nodes.
                            node.exit().remove();

                            // Report the time taken to update
                            //var end_time = new Date().getTime();
                            //console.log('Execution time of force layout update(): ' + (end_time - start_time) + 'ms');

                            //env.util.consoleMessage('# Elements', (_.size(nodes) + _.size(links)));
                            //env.util.consoleMessage('Nodes at end of update',nodes);
                            //env.util.consoleMessage('Links at end of update',links);
                            //console.log('Done updating force layout');
                        },
                        tickIt: function () {
                            for (var i = 0; i < 50; i += 1) {
                                public_api.tick();
                            }
                        },
                        tick: function () {
                            link
                                .attr("x1", function (d) {
                                    return d.source.x;
                                })
                                .attr("y1", function (d) {
                                    return d.source.y;
                                })
                                .attr("x2", function (d) {
                                    return d.target.x;
                                })
                                .attr("y2", function (d) {
                                    return d.target.y;
                                });

                            node.attr("transform", function (d) {
                                return "translate(" + d.x + "," + d.y + ")";
                            });
                        }
                    };

                return public_api;
            },
            ForceLayoutManager = function (html_id) {
                if (!(this instanceof ForceLayoutManager)) {
                    return new ForceLayoutManager();
                }

                var my_html_id,
                    force_layout,
                    myForce,
                    mySvg;

                var public_api = {
                    name: 'force',
                    update: function () {
                        force_layout.update();
                    },
                    tick: function () {
                        force_layout.tick();
                    },
                    getSvg: function () {
                        return mySvg;
                    },
                    zoom: function () {
                        mySvg.attr('transform', 'translate(' + d3.event.translate + ')' +
                            ' scale(' + d3.event.scale + ')');
                    },
                    getHtmlId: function () {
                        return my_html_id;
                    }
                };

                my_html_id = html_id;
                myForce = d3.layout.force()
                    .on("tick", public_api.tick)
                    .charge(function (d) {
                        return d.inactiveChildren && d.inactiveChildren.length > 0 ? -500 : -d.nodeSize * 100;
                    })
                    .linkDistance(function (d) {
                        return 80;
                    })
                    .size([screen.width, HEIGHT]);
                mySvg = d3.select(my_html_id).append("svg:svg")
                    .attr('id', 'forceSvg')
                    .attr("width", '100%')
                    .attr("height", HEIGHT)
                    .append("svg:g")
                    .call(d3_manager.tip);
                force_layout = new ForceLayout(myForce, mySvg);

                return public_api;
            },
            // Collapsible tree layout constructors
            TreeLayout = function (tree, svg) {
                if (!(this instanceof TreeLayout)) {
                    return new TreeLayout(svg);
                }

                var mySvg = svg,
                    myTree = tree,
                    diagonal = d3.svg.diagonal()
                        .projection(function (d) {
                            return [d.y, d.x];
                        }),
                    public_api = {
                        update: function (source) {
                            var duration = d3.event && d3.event.altKey ? 5000 : 250;

                            // Compute the new tree layout.
                            var nodes = myTree.nodes(source).reverse();
                            var liveLinks = linkManager.liveLinks();

                            // Normalize for fixed-depth.
                            nodes.forEach(function (d) {
                                d.y = d.depth * 180;
                            });

                            // Update the nodes…
                            var node = mySvg.selectAll("g.node")
                                .data(nodes, function (d) {
                                    return d.id || (d.id = i += 1);
                                })
                                .on('contextmenu', d3.contextMenu(d3_manager.getNodeContextMenu())); // attach context menu to new node

                            // Enter any new nodes at the parent's previous position.
                            var nodeEnter = node.enter().append("svg:g")
                                .attr("class", "node")
                                .attr("transform", function (d) {
                                    return "translate(" + source.y0 + "," + source.x0 + ")";
                                })
                                .on('mouseenter', function (d) {
                                    // Only change focus is there is no current focus lock set by the user
                                    if (focus_lock === false) {
                                        d3_manager.tip.show(d);
                                        mouse_on_node = true;

                                        //dom_manager.highlightPathsTo(d.name); // pass the name so that multiple nodes with the same name get highlighted
                                        countdown_to_focus = setTimeout(function () {
                                            focus_active = true;
                                            dom_manager.highlightPathsTo(d.name);
                                            public_api.update(source);
                                        }, 1000);
                                        public_api.update(source);
                                    }
                                })
                                .on('mouseleave', function () {
                                    if (focus_lock === false) {
                                        focus_active = false;
                                        mouse_on_node = false;
                                        d3_manager.tip.hide();
                                        if (left_tab_panel_displayed === true && persist_left_tab_panel === false) dom_manager.hideLeftTabPanel();
                                        //if (persist_left_tab_panel === false) general_tab_manager.hideTabs();

                                        // Only remove the focus if it has not been locked by the user
                                        clearTimeout(countdown_to_focus);
                                        public_api.update(source);
                                    }
                                })
                                .on("click", function (d) {
                                    if (left_tab_panel_enabled === true) {
                                        // Show the element's information in the 'Element Info' tab, and show that tab
                                        dom_manager.showNodeInformation(d);
                                        general_tab_manager.showElementInfoTab();
                                        left_tab_panel_displayed = true;
                                    }
                                })
                                .on("dblclick", function (d) {
                                    if (focus_lock === false) {
                                        dom_manager.clearnodeGroupselectMenu();
                                        d.toggle();
                                        public_api.update(source);
                                    }
                                });

                            nodeEnter.append("svg:circle")
                                .attr("r", 1e-6)
                                .style("fill", function (d) {
                                    return d.color;
                                }) // was "#fff" when no children
                                .style("stroke", function (d) {
                                    return d.getStrokeColor();
                                });

                            nodeEnter.append("svg:text")
                                .attr("x", function (d) {
                                    return (d.children && d.children.length > 0)
                                    || (d.inactiveChildren && d.inactiveChildren.length) > 0 ?
                                        -10 : 10;
                                })
                                .attr("dy", function (d) {
                                    return (d.children && d.children.length > 0)
                                    || (d.inactiveChildren && d.inactiveChildren.length > 0) ?
                                        "-5" : "0.35em";
                                })
                                .attr("text-anchor", function (d) {
                                    return (d.children && d.children.length > 0)
                                    || (d.inactiveChildren && d.inactiveChildren.length > 0)
                                        ? "end" : "start";
                                })
                                .text(function (d) {
                                    return d.name;
                                })
                                .style("fill-opacity", 1e-6);

                            // Transition nodes to their new position.
                            var nodeUpdate = node.transition()
                                .duration(duration)
                                .attr("transform", function (d) {
                                    return "translate(" + d.y + "," + d.x + ")";
                                });

                            nodeUpdate.select("circle")
                                .attr("r", 4.5)
                                .style("fill", function (d) {
                                    return d.getFillColor();
                                })
                                .style("stroke", function (d) {
                                    return d.getStrokeColor();
                                });

                            nodeUpdate.select("text")
                                .style("fill-opacity", 1)
                                .style("visibility", function (d) {
                                    return d.isDimmed() === true ? 'hidden' : 'visible';
                                });

                            // Transition exiting nodes to the parent's new position.
                            var nodeExit = node.exit()
                                .transition()
                                .duration(duration)
                                .attr("transform", function (d) {
                                    return "translate(" + source.y + "," + source.x + ")";
                                })
                                .remove();

                            nodeExit.select("circle")
                                .attr("r", 1e-6);

                            nodeExit.select("text")
                                .style("fill-opacity", 1e-6);

                            // Update the links…
                            var link = mySvg.selectAll("path.link")
                                .data(liveLinks, function (d) {
                                    return d.target.id;
                                })
                                .style({
                                    "stroke": function (d) {
                                        return linkManager.getLinkColor(d);
                                    },
                                    "stroke-width": function (d) {
                                        return linkManager.getWidth(d);
                                    }
                                });

                            // Enter any new links at the parent's previous position.
                            link.enter().insert("svg:path", "g")
                                .attr("class", "link")
                                .style({
                                    "stroke": function (d) {
                                        return linkManager.getLinkColor(d);
                                    },
                                    "stroke-width": function (d) {
                                        return linkManager.getWidth(d);
                                    }
                                })
                                .attr("d", function (d) {
                                    var o = {x: source.x0, y: source.y0};
                                    return diagonal({source: o, target: o});
                                })
                                .transition()
                                .duration(duration)
                                .attr("d", diagonal);

                            // Transition links to their new position.
                            link.transition()
                                .duration(duration)
                                .attr("d", diagonal);

                            //link.transition().select("circle")


                            // Transition exiting nodes to the parent's new position.
                            link.exit().transition()
                                .duration(duration)
                                .style("stroke", function (d) {
                                    return colors.black;
                                })
                                .attr("d", function (d) {
                                    var o = {x: source.x, y: source.y};
                                    return diagonal({source: o, target: o});
                                })
                                .remove();

                            // Stash the old positions for transition.
                            nodes.forEach(function (d) {
                                d.x0 = d.x;
                                d.y0 = d.y;
                            });
                        }
                    };

                return public_api;
            },
            TreeLayoutManager = function (html_id) {
                if (!(this instanceof TreeLayoutManager)) {
                    return new TreeLayoutManager();
                }

                var my_html_id,
                    tree_layout,
                    myTree,
                    mySvg,
                    svg_margins = [20, 120, 20, 120],          // margins
                    svg_base_height = 3000 - svg_margins[0] - svg_margins[2];          // height

                var public_api = {
                    name: 'tree',
                    update: function () {
                        tree_layout.update(root);
                    },
                    getSvg: function () {
                        return mySvg;
                    },
                    zoom: function () {
                        mySvg.attr('transform', 'translate(' + d3.event.translate + ')' +
                            ' scale(' + d3.event.scale + ')');
                    },
                    getHtmlId: function () {
                        return my_html_id;
                    }
                };

                my_html_id = html_id;
                myTree = d3.layout.tree()
                    .size([WIDTH, HEIGHT]);
                mySvg = d3.select(my_html_id).append("svg:svg")
                    .attr("width", '100%')
                    .attr("height", svg_base_height + svg_margins[0] + svg_margins[2])
                    .append("svg:g")
                    .call(d3_manager.tip)
                    .attr("transform", "translate(" + svg_margins[3] + "," + svg_margins[0] + ")");
                root.fixed = true;
                root.x0 = svg_base_height / 2;
                root.y0 = 0;
                tree_layout = new TreeLayout(myTree, mySvg);

                return public_api;
            },
            // Initialize managers
            dom_manager = new DomManager(),
            general_tab_manager = new GeneralTabManager(),
            d3_manager = new D3Manager(),
            d3_layout_tabs_manager = new D3LayoutTabsManager();

        function parseGraph(graph_root) {
            var i, len, graph;

            graph_root = env.util.graphTraverse(graph_root, [], function (node) {
                var newNode = new Node(node);
                if (!_.contains(nodeGroups, newNode.group)) {
                    nodeGroups.push(newNode.group);
                }
                return newNode;
            });
            n_groups = _.size(nodeGroups);

            graph = Graph(graph_root);
            for (i = 0, len = _.size(graph_root.children); i < len; i += 1) {
                // Graph with redundant nodes
                //rootNode.children[i] = Node(rootNode.children[i]);
                graph = graph_root.children[i].appendNodesAndEdges(graph, graph_root);
            }

            return graph;
        }

        function onFileLoad(evt) {
            //Retrieve the first file from the FileList object
            var file = evt.target.files[0], contents, filename, reader, graph;

            if (!file) {
                alert("Failed to open desired file!");
            } else {
                reader = new FileReader();
                reader.onload = function (e) {
                    filename = evt.target.files[0].name;
                    contents = e.target.result;
                    graph = parseGraph(JSON.parse(contents));
                    main(graph);
                    $('#fileInputListItem').hide();
                };
                reader.readAsText(file);
            }
        }

        function search(tok) {
            if (tok && tok.length > 0) {
                tok = tok.toLowerCase();
                if (dom_manager.highlightPathsTo(tok) === true) {
                    //if (dom_manager.showOnlyPathsToElement(tok) === true) {
                    d3_manager.updateActiveLayout();
                } else {
                    alert('Element <' + tok + '> not found!');
                }
            } else {
                // No search token entered. Reset active display.
                nodeManager.showAllNodes();
                dom_manager.selectAllNodes();
                d3_manager.updateActiveLayout();
            }
        }

        function main(graph, name) {
            var list,
                list2,
                item,
                item2,
                treeViewByMapping,
                treeViewByGroup,
                allElementNames;

            // Put name in heading
            d3.select('#titleDiv').append('h2')
                .attr('id', 'headingTitle')
                .attr('color', 'rgb(246, 154, 46')
                .attr('text-align', 'center')
                .attr('margin', '0')
                .attr('padding', '0')
                .html(name);

            // Parse the nodes and links for the graph
            links = graph.edges;

            // Initialize root and links
            root = graph.root;
            nodeManager = new NodeManager(root);
            nodeManager.setDrawingAttributes();

            // Side panel that displays various information about a certain node on mouse-over
            persist_left_tab_panel = true;

            // Initialize layouts
            force_layout_manager = new ForceLayoutManager('#forceLayoutView');
            tree_layout_manager = new TreeLayoutManager('#treeLayoutView');

            // Register each layout with the D3 manager
            d3_manager.addLayoutManager(force_layout_manager);
            d3_manager.addLayoutManager(tree_layout_manager);

            linkManager = new LinkManager(
                d3.layout.tree().links(d3.layout.tree().nodes(root).reverse()),
                graph.edges
            );

            // Setup for the search autocomplete functionality
            // Get all element names, and set the autocomplete property for the search input
            allElementNames = jQuery.unique(nodeManager.getAllElementNames().sort());
            $('#searchInput').autocomplete({
                source: allElementNames,
                select: function (event, ui) {
                    if (ui.item) {
                        $(event.target).val(ui.item.value);
                    }
                    search($(event.target).val());
                }
            });

            // Show graph-related items now that an graph has been loaded and parsed
            dom_manager.createLegend();
            dom_manager.populateGroupFilterMenus();
            general_tab_manager.showTabs();
            d3_layout_tabs_manager.showTabs();

            // Finalize initialization of the layouts
            //d3_manager.updateAllLayouts();
            force_layout_manager.update();
            // Make sure this function is called after force_layout_manager.update()
            //tree_layout_manager.update();

            // Slide the menu out of view to maximize space for layout
            // Set callbacks for showing/hiding various menus
            setTimeout(function () {
                var headingHeight = $('.heading').height();
                var leftTabPanelWidth = general_tab_manager.getWidth();

                // Set the listeners to have the menu appear when the mouse is in range
                $(document).mousemove(function (event) {
                    if (event.pageY <= 25 && heading_menu_shown === false
                        && (left_tab_panel_displayed === false || persist_left_tab_panel === true)) {
                        dom_manager.showHeadingMenu();
                    } else if (event.pageY > headingHeight && heading_menu_shown === true
                        && heading_pinned === false) {
                        dom_manager.hideHeadingMenu();
                    } else if (event.pageX <= 100 && left_tab_panel_enabled === true && left_tab_panel_displayed === false
                        && (heading_menu_shown === false || heading_pinned === true)) {
                        console.log('showing left tab panel');
                        dom_manager.showLeftTabPanel();
                    } else if (event.pageX > leftTabPanelWidth && left_tab_panel_displayed === true
                        && persist_left_tab_panel === false && mouse_on_node === false) {
                        console.log('hiding left tab panel');
                        dom_manager.hideLeftTabPanel();
                    }
                });
            }, 2000);

            // Tree view for finding an element by mappings from a response
            d3.select('#searchByMapping').append('p')
                .attr('class', 'tabTitle')
                .html('Click the labels below to highlight the element in the display');
            list = d3.select('#searchByMapping').append('ul').attr('id', 'treeViewByMapping');
            item = list.append('item')
                .attr('class', 'item, treeViewList')
                .attr('model', '{{treeData}}');

            // Tree view for finding an element by its type
            d3.select('#searchByGroup').append('p')
                .attr('class', 'tabTitle')
                .html('Click the labels below to highlight the element in the display');
            list2 = d3.select('#searchByGroup').append('ul').attr('id', 'treeViewByGroup');
            item2 = list2.append('item')
                .attr('class', 'item, treeViewList')
                .attr('model', '{{treeData}}');

            // define the tree list view component
            Vue.component('item', {
                props: ['model'],
                template: '#item-template',
                replace: true,
                data: function () {
                    return {
                        open: false
                    }
                },
                computed: {
                    isFolder: function () {
                        return this.model.allChildren.length > 0
                        || (this.model.children && this.model.children.length > 0)
                        || (this.model.inactiveChildren && this.model.inactiveChildren.length > 0) ? true : false;
                    }
                },
                methods: {
                    treeViewNodeSelected: function () {
                        if (this.isFolder) {
                            this.open = !this.open;
                        } else {
                            dom_manager.showLeftTabPanel();
                            dom_manager.showNodeInformation(this.model);
                            dom_manager.highlightPathsTo(this.model.name);
                            d3_manager.updateActiveLayout();
                        }
                    }
                }
            });

            // Boot up the tree view by element mapping
            treeViewByMapping = new Vue({
                el: '#treeViewByMapping',
                data: {
                    treeData: root
                }
            });

            // Boot up the tree view by element type
            treeViewByGroup = new Vue({
                el: '#treeViewByGroup',
                data: {
                    treeData: nodeManager.createMapByGroup()
                }
            });

            $('#groupSelect').val(nodeGroups[-1]);
            dom_manager.groupSelectionChange();
        }

        graph = parseGraph(JSON.parse(json_data));
        main(graph);
        $('#fileInputListItem').hide();
    });
});
