'use strict';

import React, {Component} from 'react';
import {
    AppRegistry,
    StyleSheet,
    Text,
    View,
    Image,
    TouchableHighlight,
    ListView,
    ScrollView,
    ActivityIndicator,
    TabBarIOS,
    NavigatorIOS,
    TextInput
} from 'react-native';

import CollectionDetails from './collectionDetails';

class Collection extends Component {
    constructor(props) {
        super(props);

        var ds = new ListView.DataSource({
            rowHasChanged: (r1, r2) => r1 != r2
        });
        this.state = {
            dataSource: ds.cloneWithRows([]),
            searchQuery: props.searchQuery,
            showProgress: true,
            resultsCount: 0
        };

        this.getCollection();
    }

    getCollection() {
        var deviceURI = auth0.deviceURI + auth0.deviceId;
        var getFilesURI = auth0.getFilesURI + auth0.rootID + '&limit=1000';
        var access_token = auth0.id_token;

        auth0.rootID = auth0.parentID;

        //deviceURI = 'https://qa1-proxy1.wdtest2.com:9443/1cfbaa2e-e2ea-463a-aaea-840a49a3ea8f';
        console.log('deviceURI');

        fetch(deviceURI + getFilesURI, {
            method: 'get',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token
            }
        })
            .then((response)=> response.json())
            .then((responseData)=> {
                console.log(responseData);
                responseData.files.sort(this.sort);

                var results = responseData.files.filter((el) => {
                    return el.mimeType != 'application/octet-stream'
                });

                var folders = results.filter((el) => {
                    return (el.mimeType == 'application/x.wd.dir') && (el.name == 'Photos1')
                        || (el.name == 'Photos2') || (el.name == 'Photos2')
                        || (el.name == 'Photos3')|| (el.name == 'Videos');
                });

                var filesOnly = results.filter((el) => {
                    return el.mimeType != 'application/x.wd.dir'
                });

                var items = [].concat(folders, filesOnly);

                this.setState({
                    dataSource: this.state.dataSource.cloneWithRows(items),
                    resultsCount: items.length,
                    responseData: items.slice(0,25).files
                });

            })
            .catch((error)=> {
                this.setState({
                    serverError: true
                });
            })
            .finally(()=> {
                this.setState({
                    showProgress: false
                });
            });
    }

    sort(a, b) {
        var nameA = a.name.toLowerCase(), nameB = b.name.toLowerCase();
        if (nameA < nameB) {
            return -1
        }
        if (nameA > nameB) {
            return 1
        }
        return 0;
    }

    pressRow(rowData) {
        console.log(rowData);
        if (rowData.mimeType == 'application/x.wd.dir') {
            auth0.rootID = rowData.id;
            auth0.parentID = rowData.parentID;

            this.setState({
                showProgress: false,
                dataSource: this.state.dataSource.cloneWithRows([]),
                resultsCount: [].length,
                responseData: [].files
            });

           // this.getCollection();
            this.props.navigator.push({
                title: rowData.name,
                component: Collection,
                passProps: {
                    pushEvent: rowData
                }
            });
        }

        this.props.navigator.push({
            title: rowData.name,
            component: CollectionDetails,
            passProps: {
                pushEvent: rowData
            }
        });
    }

    getThumbnailURI(item) {
        var size = 400;
        var fileId = item.id;
        var uri;
        var deviceURI = auth0.deviceURI + auth0.deviceId;

        if (item.mimeType == 'application/x.wd.dir') {
            uri = '../../../folder.png';
            return uri;
        }

        // if (!item.extension || item.extension == '.txt' || item.extension == ".pptx") {
        //     uri = '../../../no-img.png';
        //     return uri;
        // }

        uri = deviceURI +
            '/sdk/v2/files/' + fileId +
            '/content?width=' + size +
            '&height=' + size +
            '&access_token=' + auth0.id_token;
        return uri;
    }

    renderRow(rowData) {
        var pic;

        if (rowData.extension == '.txt') {
            pic = <Image
                source={require('../../../no-img.png')}
                resizeMode='stretch'
                style={styles.img1}
            />
        }

        if (rowData.mimeType == 'application/x.wd.dir') {
            pic = <Image
                source={require('../../../folder.png')}
                resizeMode='stretch'
                style={styles.img}
            />
        } else {
            pic = <Image
                source={{uri: this.getThumbnailURI(rowData)}}
                resizeMode='stretch'
                style={styles.img}
            />
        }

        return (
            <TouchableHighlight
                onPress={()=> this.pressRow(rowData)}
                underlayColor='#ddd'>

                <View style={styles.imgsList}>

                    {pic}

                    <View style={{
                        flex: 1,
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}>
                        <Text style={{fontWeight: 'bold', margin: 5}}>{rowData.name}</Text>
                        <Text style={{margin: 5}}>{rowData.mTime.split(':')[0]}</Text>
                        <Text style={{margin: 5}}>{(rowData.size / 1024).toFixed(2)} Kb.</Text>
                    </View>
                </View>
            </TouchableHighlight>
        );
    }

    refreshData(event) {
        if (event.nativeEvent.contentOffset.y <= -100) {

            this.setState({
                showProgress: true,
                resultsCount: event.nativeEvent.contentOffset.y
            });
            setTimeout(() => {
                this.getCollection()
            }, 300);
        }
    }

    render() {
        var errorCtrl = <View />;

        if (this.state.serverError) {
            errorCtrl = <Text style={styles.error}>
                Something went wrong.
            </Text>;
        }

        if (this.state.showProgress) {
            return (
                <View style={{
                    flex: 1,
                    justifyContent: 'center'
                }}>
                    <ActivityIndicator
                        size="large"
                        animating={true}/>
                </View>
            );
        }
        return (
            <View style={{flex: 1, justifyContent: 'center'}}>
                <View style={{marginTop: 60}}>
                    <TextInput style={{
                        height: 45,
                        marginTop: 4,
                        padding: 5,
                        backgroundColor: 'white',
                        borderWidth: 3,
                        borderColor: 'lightgray',
                        borderRadius: 0,
                    }}
                               onChangeText={(text)=> {
                                   var arr = [].concat(this.state.responseData);
                                   var items = arr.filter((el) => el.name.indexOf(text) != -1);
                                   this.setState({
                                       dataSource: this.state.dataSource.cloneWithRows(items),
                                       resultsCount: items.length,
                                   })
                               }}
                               placeholder="Search">
                    </TextInput>

                    {errorCtrl}

                </View>

                <ScrollView
                    onScroll={this.refreshData.bind(this)} scrollEventThrottle={16}
                    style={{marginTop: 0, marginBottom: 0}}>
                    <ListView
                        dataSource={this.state.dataSource}
                        renderRow={this.renderRow.bind(this)}
                    />
                </ScrollView>

                <View style={{marginBottom: 49}}>
                    <Text style={styles.countFooter}>
                        {this.state.resultsCount} entries were found.
                    </Text>
                </View>

            </View>
        )
    }
}

const styles = StyleSheet.create({
    imgsList: {
        flex: 1,
        flexDirection: 'row',
        padding: 0,
        alignItems: 'center',
        borderColor: '#D7D7D7',
        borderBottomWidth: 1,
        backgroundColor: '#fff'
    },
    countHeader: {
        fontSize: 16,
        textAlign: 'center',
        padding: 15,
        backgroundColor: '#F5FCFF',
    },
    countFooter: {
        fontSize: 16,
        textAlign: 'center',
        padding: 10,
        borderColor: '#D7D7D7',
        backgroundColor: 'whitesmoke'
    },
    img: {
        height: 100,
        width: 100,
        borderRadius: 20,
        margin: 15
    },
    img1: {
        height: 100,
        width: 100,
        borderRadius: 5,
        margin: 15
    },
    error: {
        color: 'red',
        paddingTop: 10,
        textAlign: 'center'
    }
});

export default Collection;
