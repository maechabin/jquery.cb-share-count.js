import $ from 'jquery';

export default class ShareCount {
  constructor(element, i, options) {
    this.element = element;
    this.$element = $(element);
    this.site_url = '';
    this.api_url = '';
    this.param_name = '';
    this.send_data = {};
    this.num = i;
    this.options = options;
    this.jqxhr = {};
    this.defaults = {
      cache: true,
      cacheTime: 86400000,
      assign: ['fb', 'hb', 'tw', 'pk'],
    };
    this.count = {
      fb: 0,
      hb: 0,
      tw: 0,
      pk: 0,
    };
  }

  setParam(url) {
    const data = {};
    const defaultData = {
      fb: {
        api_url: 'https://graph.facebook.com/',
        param: {
          id: url,
        },
      },
      hb: {
        api_url: 'http://api.b.st-hatena.com/entry.count',
        param: {
          url,
        },
      },
      tw: {
        api_url: 'https://jsoon.digitiminimi.com/twitter/count.json',
        param: {
          url,
        },
      },
      pk: {
        api_url: 'https://query.yahooapis.com/v1/public/yql',
        param: {
          q: `SELECT content FROM data.headers WHERE url=
            'https://widgets.getpocket.com/v1/button?label=pocket&count=vertical&v=1&url=${url}&src=${url}'`,
          format: 'xml',
          env: 'store://datatables.org/alltableswithkeys',
        },
      },
    };
    this.conf.assign.map((key) => (data[key] = defaultData[key]));
    return data;
  }

  getCount(key, id) {
    const d = new $.Deferred();

    this.jqxhr[id] = $.ajax({
      type: 'get',
      url: this.api_url,
      cache: false,
      timeout: 10000,
      dataType: 'jsonp',
      data: this.send_data,
      success: d.resolve,
      error: d.reject,
      context: key,
    }).fail(
      () => this.jqxhr[id].abort()
    );

    return d.promise();
  }

  takeCount(key, arg) {
    const that = this;
    const keyArray = key.split(',');

    $(arg).each(function (i) {
      const self = $.extend({}, this, { key: keyArray[i] });
      const obj = this[0] ? this[0] : this;
      switch (self.key) {
        case 'fb':
          that.count.fb = ('share' in obj && 'share_count' in obj.share) ? obj.share.share_count : 0;
          break;
        case 'hb':
          that.count.hb = (Array.isArray(obj)) ? obj[0] : obj || 0;
          break;
        case 'tw':
          that.count.tw = obj.count || 0;
          break;
        case 'pk':
          if (this[0].results) {
            const content = obj.results.toString();
            const match = content.match(/&lt;em id="cnt"&gt;(\d+)&lt;\/em&gt;/i);
            that.count.pk = (match !== null) ? Number(match[1]) : 0;
          }
          break;
        default:
          break;
      }
    });
    if (that.conf.cache) {
      that.save();
    }
    return that.render();
  }

  setup() {
    const that = this;
    const df = [];
    const data = that.setParam(that.site_url);
    $.each(data, (key, val) => {
      const id = new Date().getTime();
      this.api_url = val.api_url;
      this.send_data = val.param;
      df.push(this.getCount(key, id));
    });

    $.when.apply($, df)
      .done(function () {
        return that.takeCount(this.toString(), arguments);
      })
      .fail((res) => res.abort());
  }

  render() {
    const fb = $('.cb-fb').eq(this.num).find('span');
    const hb = $('.cb-hb').eq(this.num).find('span');
    const tw = $('.cb-tw').eq(this.num).find('span');
    const pk = $('.cb-pk').eq(this.num).find('span');
    if (this.conf.assign.includes('fb')) fb.html(this.count.fb);
    if (this.conf.assign.includes('hb')) hb.html(this.count.hb);
    if (this.conf.assign.includes('tw')) tw.html(this.count.tw);
    if (this.conf.assign.includes('pk')) pk.html(this.count.pk);
  }

  save() {
    const cache = JSON.parse(localStorage.getItem(`sc_${this.site_url}`)) || {};
    const count = {};
    let margedCount = {};

    if (this.conf.assign.includes('fb')) count.fb = this.count.fb;
    if (this.conf.assign.includes('hb')) count.hb = this.count.hb;
    if (this.conf.assign.includes('tw')) count.tw = this.count.tw;
    if (this.conf.assign.includes('pk')) count.pk = this.count.pk;
    count.saveTime = new Date().getTime();
    margedCount = $.extend({}, cache, count);
    localStorage.setItem(`sc_${this.site_url}`, JSON.stringify(margedCount));
    localStorage.setItem('cbsharecount', new Date().getTime());
  }

  checkCache() {
    let cache;
    let nocache;
    let currentTime;

    if (('localStorage' in window) && (window.localStorage !== null)) {
      cache = JSON.parse(localStorage.getItem(`sc_${this.site_url}`)) || null;
      currentTime = new Date().getTime();

      if (cache) {
        nocache = this.conf.assign.filter((key) => cache[key] === undefined);
        if (nocache.length > 0) {
          return this.setup();
        }
      }

      if (cache && currentTime - cache.saveTime < this.conf.cacheTime) {
        // console.log(cache.fb);
        this.conf.assign.map(
          (key) => (this.count[key] = (typeof cache[key] === 'number') ? cache[key] : '')
        );
        return this.render();
      }
    }
    return this.setup();
  }

  callMethod(callback) {
    if (callback) {
      return callback();
    }
    return false;
  }

  init() {
    this.site_url = this.$element.attr('title');
    this.conf = $.extend({}, this.defaults, this.options);
    if (this.conf.cache) {
      this.callMethod(this.checkCache());
    } else {
      this.callMethod(this.setup());
    }
    return this;
  }
}
