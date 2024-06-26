const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const clearHash = require('../middlewares/clearHash');


const Blog = mongoose.model('Blog');

module.exports = app => {
  app.get('/api/blogs/:id', requireLogin, async (req, res) => {
    const blog = await Blog.findOne({
      _user: req.user?.id,
      _id: req.params?.id
    });

    res.send(blog);
  });

  app.get('/api/blogs', requireLogin, async (req, res) => {
    try {
      const blogs = await Blog.find({ _user: req.user?.id })
      .cache({key: req.user?.id})
      if(blogs) {
        res.send(blogs)
        return
      };
      res.send([{title: 'hard coded title', content: 'hard coded no text'}])
      
    } catch (error) {
      res.status(500).send(error)
    }
    
  });

  app.post('/api/blogs', requireLogin, clearHash, async (req, res) => {
    const { title, content } = req.body;

    const blog = new Blog({
      title,
      content,
      _user: req.user?.id
    });

    try {
      await blog.save();
      res.send(blog);
    } catch (err) {
      res.status(400).send(err)
    } 
  });
};
