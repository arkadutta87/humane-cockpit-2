import Immutable from 'immutable';

import FluxStore from 'reactjs-web-boilerplate/lib/app/flux/FluxStore';

export default class extends FluxStore {
    constructor(key, fluxContext, fluxController) {
        super(key, fluxContext, fluxController);

        this.data = Immutable.fromJS({params: null, results: null});
    }

    noResults() {
        return this.updateData(this.data.set('results', null));
    }

    load(params) {
        if (Immutable.is(params, this.data.get('params'))) {
            // we do not do anything
            return this;
        }

        const requestTime = Date.now();

        if (params) {
            const paramJS = params.toJS();

            return this.fluxContext.restClient.post(`${this.fluxController.appProperties.get('searcherApi')}/view`, paramJS)
              .then((result) => {
                  const totalTimeTaken = (Date.now() - requestTime);

                  if (result && result.entity) {
                      return this.updateData(this.data
                        .set('params', params)
                        .set('results', Immutable.fromJS(result.entity.results))
                        .set('totalTimeTaken', totalTimeTaken)
                        .set('serviceTimeTaken', result.entity.serviceTimeTaken)
                        .set('totalResults', result.entity.totalResults));
                  }

                  return this.noResults();
              })
              .catch(() => this.noResults());
        }

        return this.noResults();
    }
}