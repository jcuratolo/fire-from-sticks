var html = {
    div: 'div'
};

var out = {
    type: html.div,
    attrs: {
        className: 'contaienr'
    },
    children: [{
        type: html.div,
        attrs: {
            className: 'row'
        },
        children: [{
            type: html.div,
            attrs: {
                className: 'col-sm-6'
            },
            children: [{
                type: html.div,
                attrs: {
                    className: 'card'
                },
                children: [{
                    type: html.div,
                    attrs: {
                        className: 'card-block'
                    },
                    children: [{
                            type: html.h4,
                            attrs: {
                                className: 'card-title'
                            },
                            children: 'Hi this is the title'
                        },
                        {
                            type: html.p,
                            attrs: {
                                className: 'card-text'
                            },
                            children: "And here is some card text"
                        }
                    ]
                }]
            }]
        }]
    }]
}