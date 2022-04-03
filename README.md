# vue-slim
 The easiest way to use petite-vue & a few other frameworks

# CLI
Vue-Slim has a command line interface, which can be accessed by simply running `npx vue-slim`

# How to use
First, create simple html file. For example:

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vue-Slim Page</title>
    </head>
    <body>
        
    </body>
</html>
```

and add following lines to the head of the html file:

```html
<!-- Start Vue-Slim -->
<style>/*Keeps content hidden until vue is loaded*/[v-scope]{display:none;}</style>
<!-- @WYTE/INIT -->
<!-- <script src="slim.js"></script> -->
<script src="https://unpkg.com/petite-vue" defer init></script>
<!-- End Vue-Slim -->
```