import app from './app';

app.listen(process.env.PORT, () => {
  console.info(
    `Server is listening on: ${process.env.APP_URL}:${process.env.PORT}`
  );
});
