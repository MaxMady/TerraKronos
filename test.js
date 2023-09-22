// Declare an array outside the function
const myArray = new Array(10).fill('');
myArray[0] = "d"
myArray[2] = "a"
// Define the function to shift and update the array
function shiftAndAdd(newItem) {
  // Remove the first item (the oldest) from the array
  myArray.shift();
  
  // Add the new item to the end of the array
  myArray.push(newItem);
}

// Test the function
shiftAndAdd('Item 1');

console.log(myArray); // Output: ['Item 2', 'Item 3', '', '', '', '', '', '', '', '']
