import Immutable from 'immutable';

import FluxStore from 'reactjs-web-boilerplate/lib/app/flux/FluxStore';

export default class extends FluxStore {
    constructor(key, fluxContext, fluxController) {
        super(key, fluxContext, fluxController);

        this.data = Immutable.fromJS({params: null, result: []});
    }

    explain(api, params) {
        if (Immutable.is(params, this.data.get('params'))) {
            // we do not do anything
            return this;
        }

        const requestTime = Date.now();

        const paramJS = params.toJS();
        paramJS.requestTime = requestTime;

        return this.fluxContext.restClient.post(`${this.fluxController.appProperties.get('searcherApi')}/explain/${api}`, paramJS)
          .then((result) => {
              const totalTimeTaken = (Date.now() - requestTime);

              if (result && result.entity) {
                  const data = this.data
                    .set('params', params)
                    .set('result', Immutable.fromJS(result.entity))
                    .set('totalTimeTaken', totalTimeTaken)
                    .set('serviceTimeTaken', result.entity.serviceTimeTaken)
                    .set('queryTimeTaken', result.entity.queryTimeTaken);

                  return this.updateData(data);
              }

              return null;
          })
          .catch(() => null);
    }
}