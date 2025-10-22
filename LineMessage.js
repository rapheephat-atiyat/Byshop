(async () => {

    const res = await fetch("https://line-chrome-gw.line-apps.com/api/talk/thrift/Talk/TalkService/getRecentMessagesV2", {
        "headers": {
            "content-type": "application/json",
            "x-hmac": "SthSjbK1HipOqteCRcKFlqWkYXgz7HQLbFLghK7SM4c=",
            "x-line-access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI0NzVhZDQ3ZS1hMWM5LTQxMTAtYmY2OC05ZjA5OTY4MTU3NDgiLCJhdWQiOiJMSU5FIiwiaWF0IjoxNzYwMjc2NDEyLCJleHAiOjE3NjA4ODEyMTIsInNjcCI6IkxJTkVfQ09SRSIsInJ0aWQiOiIwOTlkY2VjYi1iMWRkLTRmMjAtOWE3Yy1mZTkwZTFkOGYzNTUiLCJyZXhwIjoxNzkxODEyNDEyLCJ2ZXIiOiIzLjEiLCJhaWQiOiJ1NDAzNTU0ODk2ZTMyZjM2YTZjNTQxODcxODFhYzJhNzQiLCJsc2lkIjoiNDQzZDVhMjAtNzYzNy00MmJkLWJiMDItZjZjZWZlNjYyYmQyIiwiZGlkIjoiTk9ORSIsImN0eXBlIjoiQ0hST01FT1MiLCJjbW9kZSI6IlNFQ09OREFSWSIsImNpZCI6IjAzMDAwMDAwMDAifQ.C38x3EJFw6Yc3ITxy7N9TM8wVaBhMWt65rbYQQWUMec",
            "x-line-chrome-version": "3.7.1",
        },
        "body": "[\"UhtGarPE25BUuiorh3UnzO1ATI6kNy1PJIhciE587DBg\",50]",
        "method": "POST"
    });

    const data = await res.json();
    console.log(data.data[0].contentMetadata);
})()

