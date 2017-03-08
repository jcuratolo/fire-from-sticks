var html = {
    div: 'div',
    span: 'span',
    p: 'p',
    h4: 'h4',
    li: 'li',
    ul: 'ul'
};

var {
    div,
    span,
    p,
    h4,
    li,
    ul
} = html;

function createElement(html) {
    if (isEl(html)) {
        var tag = html.shift()
        var attrs = html.shift();
        var el = document.createElement(tag)
        var children = html;
        var flattenedChildren = flatten(children);
        var childElements = flattenedChildren.map(createElement);

        childElements.forEach(child => {
            el.appendChild(child);
        });

        return Object.assign(el, attrs);
    }

    if (typeof html === 'string' || typeof html === 'number')
        return document.createTextNode(html);

    throw new Error('html must be a string, number or element represented as an array');

    function flatten(arr) {
        return arr.reduce((flat, child) => {
            if (isEl(child))
                flat.push(child);
            if (!isEl(child) || !Array.isArray(child))
                flat = flat.concat(child);
            else if (!isEl(child) && Array.isArray(child))
                flat = flat.concat(flatten(child));

            return flat;
        }, []);
    }

    function isEl(html) {
        return Array.isArray(html) && typeof html[0] === 'string' && typeof html[1] === 'object';
    }
}

function model(config) {
    var {
        handlers,
        effects,
        state,
        handleError,
        handleStateChange
    } = config;

    return function send(type, data) {
        var handler = handlers[type];
        var effect = effects[type];

        if (typeof handler !== 'function' && typeof effect !== 'function')
            throw new Error(`Action type ${type} has no handler.`)

        // Run handler lol
        if (handler) {
            try {
                var stateCopy = Object.assign({}, state);
                var prevState = Object.assign({}, state);                
                var nextState = handler.call(null, stateCopy, data);

                if (typeof nextState !== 'object')
                    throw new Error(`Handler ${type} did not return a new state object.`);
                
                state = nextState;
                handleStateChange(prevState, state, send);
            } catch (e) {
                handleError(e);
            }

            // Run effect
        } else if (effect) {
            effect.call(null, state, data).catch(error => handleError(state, error))
        }
    }
}

var send = model({
    handleStateChange: (previousState, state, send) => {
        console.log(state);
        renderApp(state);
        if (previousState.selectedUser && previousState.selectedUser.id !== state.selectedUser.id)
            send('fetchUserData', {user: state.selectedUser.login});
    },
    handleError: (error, state) => {
        console.error(error)
    },
    state: {
        users: [],
        selectedUser: null,
    },
    handlers: {
        start: (state) => {
            return state
        },
        sayHi: (state, data) => {
            console.log("Hi!")
        },
        setUsers: (state, data) => {
            return Object.assign({}, state, { users: data.users })
        },
        setUserDetails: (state, data) => {
            return Object.assign({}, state, { userDetails: data.userDetails })
        },
        selectUser: (state, data) => {
            return Object.assign(state, { 
                selectedUser: state.users.filter(user => user.id === data.userId)[0]
            });
        }
    },
    effects: {
        fetchUsers: (state, data) => {
            return axios
                .get('http://api.github.com/users')
                .then(response => {
                    send("setUsers", { users: response.data });
                })
        },
        fetchUserData: (state, data) => {
            return axios.get(`http://api.github.com/users/${data.user}`)
                .then(response => {
                    send('setUserDetails', { userDetails: response.data });
                })
        }
    }
})
function renderApp(state) {
    var app = 
    [div, {className: 'container'},
        [div, {className: 'row'},
            [div, {className: 'col-sm-4'},
                [div, {className: 'card'},
                    [div, {className: 'card-block'},
                        ['button', {className: 'btn btn-default', onclick: function (e) {
                            send('fetchUsers');
                        }}, 'Load Users'],
                    ],
                    [div, {className: 'card-block'},
                        ['table', {className: 'table table-sm', hidden: !Boolean(state.users.length)},
                            ['thead', {}, 
                                ['tr', {}, 
                                    ['th', {}, 'ID'],
                                    ['th', {}, 'Login'],
                                    ['th', {}, 'Type']]],
                            ['tbody', {},
                                state.users.map(user =>['tr', {}, 
                                    ['td', {}, user.id],    
                                    ['td', {}, user.login], 
                                    ['td', {}, user.type],
                                    ['td', {}, ['button', {className: 'btn btn-info btn-sm', onclick: function () {
                                        send('selectUser', {userId: user.id})
                                    }}, 'Details']]])]]]
                ]
            ],
            [div, {className: 'col-sm-6', hidden: Boolean(!state.selectedUser)}, [
                [div, {className: 'card'}, 
                    ['img', {className: 'card-img-top', src: state.selectedUser ? state.selectedUser.avatar_url : ''}],
                    [div, {className: 'card-block'}, [
                        [h4, {className: 'card-title'}, state.userDetails ? state.userDetails.name : ''],
                        [p, {className: 'card-text'}, state.userDetails ? state.userDetails.email : '']
                    ]]
                ]
            ]]
        ]];

    var renderedApp = createElement(app);
    document.getElementById('app').innerHTML = '';
    document.getElementById('app').appendChild(renderedApp);
}

send("start");