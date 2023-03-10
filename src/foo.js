// Some types to mess with
let x = null;
let y;
let str = "Hey this is a string!";
let num = 69;
let party = true;
// This
let test = {
    "my": "object"
};

// And some literals
const arr = [1, 2, "three", 4.5]


function fib(x) {
    if (x <= 1)
        return x
    return fib(x - 1) + fib(x - 2);
}

function fib_memoized(x, prev = {}) {
    // return 0 indexed fib number
    if (x <= 1) {
        return x;
    }

    // have I computed this before?
    if (prev[x]) {
        return prev[x];
    }

    // I have not computed it, set it
    prev[x] = fib_memoized(x - 1, prev) + fib_memoized(x - 2, prev);
    return prev[x];

}

function fib_iter(x) {
    if (x <= 1) {
        return x
    }
    a = 0;
    b = 1;
    for (; x - 2 >= 0; x--) {
        temp = b;
        b += a;
        a = temp;
    }
    return b;
}

// label: while (1) {
//     console.log("I'm out of control!");
//     setTimeout(10);
// }