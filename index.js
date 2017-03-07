var html = {
    div: 'div',
    span: 'span',
    p: 'p',
    h4: 'h4'
};

function render(html) {
    if (html.length === 0)
        return;

    var type = html[0];
    var attributes = html[1];
    var children = html[2];
    var el = document.createElement(type || 'div');

    // Set attributes
    if (Object.keys(attributes).length)
        Object.assign(el, attributes);

    if (typeof children === 'string') {
        el.innerHTML = children;
    }

    if (Array.isArray(children) && typeof children[0] === 'string') {
        throw new Error("Children should be an array of elements")
    }

    if (Array.isArray(children)) {
        // Render and append children
        children.forEach(function (child) {
            if (typeof child === 'string') {
                el.innerHTML = child;
            }

            if (Array.isArray(child)) {
                var renderedChild = render(child)

                if (renderedChild instanceof HTMLElement) {
                    el.appendChild(renderedChild);
                }
            }
        })
    }

    return el;
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
                var currentState = state;
                var stateCopy = Object.assign({}, state);
                var nextState = handler.call(null, stateCopy, data);

                if (!nextState) {
                    throw new Error('Handlers should return a new state object');
                }

                state = nextState;
                handleStateChange(currentState, nextState);
            } catch (e) {
                handleError(e);
            }

            // Run effect
        } else {
            effect.call(null, state, data).catch(error => handleError(state, error))
        }
    }
}

var send = model({
    handleStateChange: (previous, state) => {
        renderApp(state);
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
            return Object.assign({}, state, {
                users: data.users
            })
        },
        selectUser: (state, data) => {}
    },
    effects: {
        fetchUsers: (state, data) => {
            return axios
                .get('http://api.github.com/users')
                .then(function (response) {
                    send("setUsers", {
                        users: response.data
                    });
                })
        },
    }
})


function renderApp(state) {
    var app = [html.div, {className: 'container'}, [
            [html.div, {className: 'row'}, [
                    [html.div, {className: 'col-sm-6'},[
                            [html.div, {className: 'card'},[
                                    [html.div, {className: 'card-block'},[
                                            [html.h4, {className: 'card-title'}, 'Users'],
                                            [html.p, {className: 'card-text'}, 'Some writing inside the card.'],
                                            [html.button, {
                                                className: 'btn btn-primary',
                                                onclick: function () {
                                                    send("fetchUsers");
                                                }},
                                                'Fetch Users'
                                            ]
                                        ]
                                    ]
                                ].concat(state.users.map(user => [html.div, {className: 'card-block'}, user.login]))
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ];
    document.getElementById('app').appendChild(render(app));
}

send("start");