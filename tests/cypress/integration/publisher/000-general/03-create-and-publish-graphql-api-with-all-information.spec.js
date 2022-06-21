/*
 * Copyright (c) 2022, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *  
 * http://www.apache.org/licenses/LICENSE-2.0
 *  
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import Utils from "@support/utils";

describe("Create GraphQl API from file", () => {
    const username = 'admin';
    const password = 'admin';
    const filepath = 'api_artifacts/schema_graphql.graphql';
    const modifiedFilepath = 'api_artifacts/modified_schema_graphql.graphql'
    const apiVersion='1.0.0';
    const apiContext="/swapi";
    const apiName='StarWarsAPI';
    const starWarsQueryRequest=`query{
      human(id:1000){\n
         id\n
         name\n
      }\n
      droid(id:2000){\n
         name\n
         friends{\n
             name\n
             appearsIn\n
             {downarrow}{backspace}`;

    const starWarsQueryResponse=`{
      "data": {
        "human": {
          "id": "1000",
          "name": "Luke Skywalker"
        },
        "droid": {
          "name": "C-3PO",
          "friends": [
            {
              "name": "Luke Skywalker",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "Han Solo",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "Leia Organa",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "R2-D2",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            }
          ]
        }
      }
    }`;

    const starWarsSubscriptionRequest=`subscription {
      reviewAdded(episode: JEDI) {
         stars\n
         episode\n
   
         commentary\n`;
    
    const starWarsSubscriptionResponse=`{"data":{"createReview":{"stars":3,"episode":"JEDI","commentary":"Excellent"}}}`;


    beforeEach(function(){
        cy.loginToPublisher(username, password);
        cy.on('uncaught:exception', (err, runnable) => {
          if (err.message.includes('applicationId is not provided')||err.message.includes('validateDescription is not a function')) {
            return false
          }
        });
      
    })

    it("Verify GraphQl API Capabilities", () => {
  
      //create a graphql API
        cy.createGraphqlAPIfromFile(apiName,apiVersion,apiContext,filepath);

        //verify that show more operations button at overview page redirects to operaion page
        cy.get('[data-testid="show-more-navigate-to-operation"]').should('have.attr', 'href')
        .then((href) => {
          cy.get('#itest-api-details-api-config-acc').click();
          cy.get('#left-menu-operations').click();
          cy.url().should('eq', `${Utils.getAppOrigin()}${href}`);
        })
          
        //schema definition
        cy.get('#itest-api-details-api-config-acc').click();
        cy.contains('a','Schema Definition').click();
        
        //modify a graphql schema definition
        cy.modifyGraphqlSchemaDefinition(modifiedFilepath);

        cy.timeout(6000);

        //localscopes
        cy.get('#left-menu-itemLocalScopes').should('have.attr', 'href')
        .then((href) => {
          cy.visit(`${Utils.getAppOrigin()}${href}/create`);
        })
        cy.timeout(3000);
        cy.createLocalScope('adminScope','admin scope',"sample description",['admin']);
        
        cy.get('#left-menu-itemLocalScopes').should('have.attr', 'href')
        .then((href) => {
          cy.visit(`${Utils.getAppOrigin()}${href}/create`);
        })
        cy.timeout(3000);
        cy.createLocalScope('filmSubscriberScope','filmSubscriber scope',"sample description",['FilmSubscriber']);

        cy.timeout(3000);
        cy.get('#left-menu-operations').click();
        
        cy.get('table').get('[data-testid="allCharacters-tbl-row"]').find('td').eq(2).click().get('ul').contains('li','Unlimited').click();
        cy.get('table').get('[data-testid="allCharacters-tbl-row"]').find('td').eq(3).click().get('ul').contains('li','adminScope').click();
        cy.get("#menu-").click();
        cy.get('table').get('[data-testid="allCharacters-tbl-row"]').find('td').eq(4).get('[data-testid="allCharacters-security-btn"]').click();
        
        cy.get('table').get('[data-testid="allDroids-tbl-row"]').find('td').eq(2).click().get('ul').contains('li','Unlimited').click();
        cy.get('table').get('[data-testid="allDroids-tbl-row"]').find('td').eq(3).click().get('ul').contains('li','filmSubscriberScope').click();
        cy.get("#menu-").click();
        //cy.get('table').get('[data-testid="allDroids-tbl-row"]').find('td').eq(4).get('[data-testid="allDroids-security-btn"').click();
        cy.get('[data-testid="custom-select-save-button"]').click();
        cy.timeout(6000);

        //deployments
        cy.get('#react-root').scrollTo('top');
        cy.get('#left-menu-itemdeployments').click();
        cy.get('#deploy-btn').click();
        cy.timeout(6000);
             
        //publish
        cy.get("#left-menu-overview").click();
        cy.contains('button','Publish').click();
        

        //visit dev portal and view API
        cy.logoutFromPublisher();
        cy.loginToDevportal(username, password);
        cy.timeout(6000);
        cy.get('table > tbody > tr').get(`[area-label="Go to ${apiName}"]`).click();
        cy.timeout(6000);

        //should contain two urls : HTTP URL and Websocket URL
        cy.get('#gateway-envirounment').get('[data-testid="http-url"]').should('exist');
        cy.get('#gateway-envirounment').get('[data-testid="websocket-url"]').should('exist');
        
        // Go to application subscription page
        cy.get("#left-menu-credentials").click();
        cy.contains('a','Subscription & Key Generation Wizard').click();
        cy.get('#application-name').type("Graphql Client App");
        cy.get('#per-token-quota').click();
        cy.get('ul').find('li').eq(2).click();
        cy.get('#application-description').type("Sample Description");
        cy.timeout(3000);
        cy.get('#wizard-next-0-btn').click();
        cy.timeout(3000);
        cy.get('#wizard-next-1-btn').click();
        cy.timeout(3000);
        cy.get('#wizard-next-2-btn').click();
        cy.timeout(3000);
        cy.get('#wizard-next-3-btn').click();
        cy.timeout(3000);
   
        cy.get("#left-menu-test").click();

        cy.intercept('**/applications/').as('getApplication');
        cy.wait('@getApplication').then((res) => {
            // Check if the resource exists
            cy.get("#selected-application").should('exist');
        });
             

        cy.get('#gen-test-key').click();
        cy.get('[aria-label="Query Editor"]').type(starWarsQueryRequest);
        cy.get('.topBar').get('.execute-button-wrap').get('button.execute-button').click();

        cy.intercept('POST','/swapi/1.0.0',(res) => {
          console.log(res);
          expect(res.body).to.include(starWarsQueryResponse);
        }).as("queryResponse");
        
        cy.get('[aria-label="Query Editor"]').type('{cmd}a{backspace}');
        cy.get('[aria-label="Query Editor"]').type('{backspace}'+starWarsSubscriptionRequest);
        cy.get('.topBar').get('.execute-button-wrap').get('button.execute-button').click();
        
        cy.intercept('GET','/swapi/1.0.0/*',(res) => {
          console.log(res);
          expect(res).property('status').to.equal(200);
          expect(res).property('type').to.equal('websocket');
        }).as("switchProtocol");

        
         cy.request({
          method: 'POST',
          url: 'http://localhost:8080/graphql',
          headers:{
            'accept': "application/json", 
            'Content-type': "application/json"
          },
          body: {
            "query":`mutation {createReview(episode: JEDI, review: { stars: 3, commentary: \"Excellent\"}) { stars   episode   commentary }}`,
            "variables":null
          },
        }).then((resp) => {
          console.log("resp:",resp.body);
          expect(JSON.stringify(resp.body)).to.include(starWarsSubscriptionResponse);
        });      


    });



    after(function () {
        // Test is done. Now delete the api
        cy.get(`#itest-id-deleteapi-icon-button`).click();
        cy.get(`#itest-id-deleteconf`).click();

        cy.visit(`${Utils.getAppOrigin()}/carbon/user/user-mgt.jsp`);
        cy.deleteUser(publisher);
    })
})
