<!--
* 
* This is an example Vue-Slim Component
* Vue-Slim Components are written exactly the same way as Vue Components
* This example component is a simple counter
*
-->

<!-- Here is the HTML template for the component -->
<template>
  <div>
    <h1>Counter</h1>
    <p>
      <button @click="decrement">-</button>
      <span> {{ count }} </span>
      <button @click="increment">+</button>
    </p>
  </div>
</template>

<!-- Here is the JavaScript code for the component -->
<script>
export default {
  props: ['initialCount'], // Define here which properties the component will receive
  data () {
    // Use the data function to set variables for the component
    return {
      count: this.initialCount // Here we define the initial value of the data
    }
  },
  methods: {
    // Here you can define the functions that will be available in the component
    increment () {
      this.count++
    },
    decrement () {
      this.count--
    }
  }
}
</script>

<!-- Here is the CSS code for the component -->
<!-- If you want to use an external CSS file, import it in the script tag above -->
<!-- Note: If you add the scoped attribute like below, the CSS will only apply to this component -->
<style scoped>
  button {
    display: inline-block;
    width: 40px;
    height: 40px / 2;
    background-color: #666;
    color: #fff;
    border: 1px solid #fff;
    border-radius: 3px;
  }
  button:hover {
    cursor: pointer;
    background-color: rgb(118, 117, 117);
  }
  span {
    font-weight: bold;
    font-size: 40px / 2;
    margin-left: 3px;
    margin-right: 3px;
  }
  div {
    text-align: center;
    padding: 1em;
    background-color: #1c1c1c;
    border: 1px solid #ccc;
    border-radius: 3px;
  }
</style>