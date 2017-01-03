import React from 'react';
import QueryString from 'qs';
import FluxControllerMixin from 'reactjs-web-boilerplate/lib/app/flux/FluxControllerMixin';
import NavBarContainer from 'reactjs-web-boilerplate/lib/app/components/NavBarContainer';
import LeftSection from 'reactjs-web-boilerplate/lib/app/components/LeftSection';
import MidSection from 'reactjs-web-boilerplate/lib/app/components/MidSection';

export default React.createClass({
    mixins: [FluxControllerMixin],

    topBar() {
        return (<div className="top-bar center-align middle-align">
            <h5 className="page-title">{this.getAppProperties().get('cockpitName', 'Cockpit')} </h5>
        </div>);
    },

    render() {
        const appProperties = this.getAppProperties();
        console.log(JSON.stringify(appProperties));
        return (<div className="page-content cockpit-page cockpit-home-page">
            <header>
                <NavBarContainer>
                    {this.topBar()}
                </NavBarContainer>
            </header>
            <main>
                <div className="row">
                    <LeftSection>
                        <div >
                            <a href={`${appProperties && appProperties.get('baseUrl') || ''}/arka/d3`} target="_blank">
                                D3 Chart Demo
                            </a>
                            <br/>
                            <br/>
                            <a href={`${appProperties && appProperties.get('baseUrl') || ''}/arka/d3/1`} target="_blank">
                                D3 Chart Demo 2
                            </a>
                            <br/>
                            <br/>
                            <a href={`${appProperties && appProperties.get('baseUrl') || ''}/arka/d3/2`} target="_blank">
                                D3 Chart Demo 3
                            </a>

                            <br/>
                            <br/>
                            <a href={`${appProperties && appProperties.get('baseUrl') || ''}/singlePageApp`} >
                                Single Page App Demo
                            </a>

                            <br/>
                            <br/>
                            <a href={`${appProperties && appProperties.get('baseUrl') || ''}/dashboard`} >
                                DashBoard
                            </a>


                        </div>
                    </LeftSection>
                    <MidSection>
                        <div className="section large">
                            <h3 className="underline">Demos</h3>
                            <ul>
                                <li>
                                    <a href={`${appProperties && appProperties.get('baseUrl') || ''}/autocomplete`} target="_blank">
                                        Autocomplete Demo
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </MidSection>




                </div>
            </main>
        </div>);
    }
});