import { helper } from '@ember/component/helper';

export default helper(function commaHelper([value]) {
  if (value == null) return '';
  return value.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
});
