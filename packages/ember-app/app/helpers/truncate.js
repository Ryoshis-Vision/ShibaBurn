import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';


export default Helper.extend({
  ethereum: service(),

  compute([str, length]/*, hash*/) {
    var short = str.slice(0, length);
    if (short.length > str.length - 3)
      return str;
    else return short + '...';
  }
});

