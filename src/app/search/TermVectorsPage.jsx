import React from 'react';
import Immutable from 'immutable';

import FluxControllerMixin from 'reactjs-web-boilerplate/lib/app/flux/FluxControllerMixin';

import NavBarContainer from 'reactjs-web-boilerplate/lib/app/components/NavBarContainer';
import MidSection from 'reactjs-web-boilerplate/lib/app/components/MidSection';

import {default as TermVectorsStore} from './TermVectorsStore';

const StoreKey = 'TermVectorsStore';

const Heading = (props) =>
  (<div className="section heading">
      <table className="params">
          <tbody>
          <tr>
              <td className="param-key">Id</td>
              <td>-</td>
              <td className="param-value">{props.data.getIn(['params', 'id'])}</td>
          </tr>
          <tr>
              <td className="param-key">Type</td>
              <td>-</td>
              <td className="param-value">{props.data.getIn(['params', 'type'])}</td>
          </tr>
          </tbody>
      </table>
      <div className="time-taken">
          Total Time: {props.data.get('totalTimeTaken')}ms, Service Time: {props.data.get('serviceTimeTaken')}ms
      </div>
  </div>);

export default React.createClass({
    mixins: [FluxControllerMixin],

    getInitialState() {
        this.getFluxController().createStore(TermVectorsStore, StoreKey);
        this.registerStore(StoreKey);

        return {
            data: this.getStoreData(StoreKey)
        };
    },

    componentDidMount() {
        this.store().termVectors(Immutable.fromJS({id: this.props.params.id, type: this.props.params.type}));
    },

    store() {
        return this.getStore(StoreKey);
    },

    topBar() {
        return (<div className="top-bar center-align middle-align">
            <h5 className="page-title">{this.getAppProperties().get('cockpitName', 'Cockpit')} - Term Vectors</h5>
        </div>);
    },

    render() {
        return (<div className="page-content cockpit-page explain-result-page">
            <header>
                <NavBarContainer>
                    {this.topBar()}
                </NavBarContainer>
            </header>
            <main>
                <div className="row">
                    <MidSection>
                        <Heading data={this.state.data}/>
                        <pre>{JSON.stringify(this.state.data.get('result').toJS(), null, 2)}</pre>
                    </MidSection>
                </div>
            </main>
        </div>);
    }
});