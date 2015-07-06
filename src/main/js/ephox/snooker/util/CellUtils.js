define(
  'ephox.snooker.util.CellUtils',

  [
    'ephox.peanut.Fun',
    'ephox.sugar.api.Attr',
    'global!parseInt'
  ],

  function (Fun, Attr, parseInt) {
    var getSpan = function (cell, type) {
      return Attr.has(cell, type) && parseInt(Attr.get(cell, type), 10) > 1;
    };

    var hasColspan = function (cell) {
      return getSpan(cell, 'cellspan');
    };

    var hasRowspan = function (cell) {
      return getSpan(cell, 'rowspan');
    };

    return {
      hasColspan: hasColspan,
      hasRowspan: hasRowspan,
      minWidth: Fun.constant(10),
      minHeight: Fun.constant(10)
    };
  }
);