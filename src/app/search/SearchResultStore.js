import Immutable from 'immutable';

import FluxStore from 'reactjs-web-boilerplate/lib/app/flux/FluxStore';

const PageSize = 10;

//const socketIOClient = require('socket.io-client');

export default class extends FluxStore {
    constructor(key, fluxContext, fluxController) {
        super(key, fluxContext, fluxController);

        this.data = Immutable.fromJS({params: null, results: []});
    }

    //createSocket() {
    //    this.socket = socketIOClient(`${window.location.protocol}//${window.location.hostname}:3000`);
    //
    //    this.socket.on('autocomplete-results', result => {
    //        if (!result) {
    //            return this.noSuggestions();
    //        }
    //
    //        const totalTimeTaken = (Date.now() - result.requestTime);
    //        return this.updateData(this.data.set('suggestions', Immutable.fromJS(result)).set('totalTimeTaken', totalTimeTaken));
    //    });
    //}

    setParams(params) {
        params.count = PageSize;

        return this.updateData(this.data.set('params', Immutable.fromJS(params)));
    }

    noResults() {
        return this.updateData(this.data.set('results', null)/*.set('totalTimeTaken', null)*/);
    }

    search(page) {
        if (page === this.data.getIn(['params', 'page'])) {
            // we do not do anything
            return this;
        }

        const requestTime = Date.now();

        //this.socket.emit('autocomplete', {text, count, filter, requestTime});

        const paramJS = this.data.get('params').toJS();
        paramJS.page = page;
        paramJS.requestTime = requestTime;

        return this.fluxContext.restClient.post(`${this.fluxController.appProperties.get('searcherApi')}/search`, paramJS)
          .then((result) => {
              const totalTimeTaken = (Date.now() - requestTime);

              if (result && result.entity) {
                  let data = this.data
                    .setIn(['params', 'page'], page)
                    .set('hasMoreResults', result.entity.totalResults > (page + 1) * PageSize);

                  let existingResults = data.get('results');
                  Immutable.fromJS(result.entity.results).forEach((bean) => existingResults = existingResults.push(Immutable.fromJS(bean)));

                  data = data.set('results', existingResults);

                  if (page === 0) {
                      data = data.set('totalTimeTaken', totalTimeTaken)
                        .set('serviceTimeTaken', result.entity.serviceTimeTaken)
                        .set('queryTimeTaken', result.entity.queryTimeTaken)
                        .set('totalResults', result.entity.totalResults);
                  }

                  return this.updateData(data);
              }

              return this.noResults();
          })
          .catch(() => this.noResults());
    }
}