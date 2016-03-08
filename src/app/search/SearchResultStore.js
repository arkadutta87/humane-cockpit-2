import _ from 'lodash';
import Immutable from 'immutable';

import FluxStore from 'reactjs-web-boilerplate/lib/app/flux/FluxStore';

const PageSize = 5;

//const socketIOClient = require('socket.io-client');

export default class extends FluxStore {
    constructor(key, fluxContext, fluxController) {
        super(key, fluxContext, fluxController);

        this.data = Immutable.fromJS({params: null, results: null});
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
    //
    //setParams(params) {
    //    params.count = PageSize;
    //
    //    return this.updateData(this.data.set('params', Immutable.fromJS(params)));
    //}

    //noResults() {
    //    return this.updateData(this.data.set('results', null)/*.set('totalTimeTaken', null)*/);
    //}

    search(params) {
        if (!params.page) {
            params.page = 0;
        }

        if (!params.count) {
            params.count = PageSize;
        }

        params = _.extend(!!this.data.get('params') ? this.data.get('params').toJS() : {}, params);

        const requestTime = params.requestTime = Date.now();

        //this.socket.emit('autocomplete', {text, count, filter, requestTime});

        return this.fluxContext.restClient.post(`${this.fluxController.appProperties.get('searcherApi')}/search`, params)
          .then((result) => {
              const totalTimeTaken = (Date.now() - requestTime);

              let data = this.data.set('params', Immutable.fromJS(params));

              if (params.page === 0) {
                  data = data.set('results', null);
              }

              if (result && result.entity) {
                  const multi = data.get('multi') || result.entity.multi;
                  if (multi) {
                      let existingResultGroups = data.get('results') || Immutable.Map();

                      const results = result.entity.multi ? result.entity.results : {[result.entity.name || result.entity.type]: result.entity};

                      Immutable.fromJS(results).entrySeq().forEach(value => {
                          const key = value[0];
                          const newResultGroup = value[1];

                          let existingResultGroup = existingResultGroups.get(key);

                          if (existingResultGroup) {
                              let existingResults = existingResultGroup.get('results');
                              newResultGroup.get('results').forEach(newResult => {
                                  existingResults = existingResults.push(Immutable.fromJS(newResult));
                              });

                              existingResultGroup = existingResultGroup.set('results', existingResults);
                          } else {
                              existingResultGroup = newResultGroup;
                          }

                          existingResultGroup = existingResultGroup.set('page', params.page)
                            .set('hasMoreResults', newResultGroup.get('totalResults') > (params.page + 1) * PageSize);

                          existingResultGroups = existingResultGroups.set(key, existingResultGroup);
                      });

                      data = data.set('results', existingResultGroups);
                  } else {
                      let existingResults = data.get('results') || Immutable.List();
                      Immutable.fromJS(result.entity.results).forEach(newResult => {
                          existingResults = existingResults.push(Immutable.fromJS(newResult));
                      });

                      data = data.set('results', existingResults)
                        .set('page', params.page)
                        .set('hasMoreResults', result.entity.totalResults > (params.page + 1) * PageSize)
                        .set('name', result.entity.name)
                        .set('type', result.entity.type);
                  }

                  if (params.page === 0) {
                      data = data.set('totalTimeTaken', totalTimeTaken)
                        .set('multi', result.entity.multi)
                        .set('serviceTimeTaken', result.entity.serviceTimeTaken)
                        .set('queryTimeTaken', result.entity.queryTimeTaken)
                        .set('totalResults', result.entity.totalResults);
                  }
              }

              return this.updateData(data);
          })
          .catch(error => {
              console.error(`Error in posting to: ${this.fluxController.appProperties.get('searcherApi')}/search}`, params, error);
          });
    }
}