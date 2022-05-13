import { helper } from '@ember/component/helper';

export default helper(function commaHelper([value]) {
  if (value == null) return '';
  var values = value.toString().split('.');
  values[0] = values[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
  if (values[1]) return values[0] + '.' + values[1];
  else return values[0];

});
