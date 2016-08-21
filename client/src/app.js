function start() {
  console.log('start');

  const userKey = $('#userKey').val();

  load(userKey);
}

function load(userKey) {
  console.log('load', userKey);

  const url = 'http://localhost:2030/' + userKey;

  $.getJSON(url, user => {
    render(user);

    if (user.inProgres) {
      setTimeout(() => {
        load(userKey);
      }, 5000);
    }
  }).fail(error => {
    console.error(error);
  });
}

function render(user) {
  console.log('render', userKey);
  // user
  const $user = $('#user')
    .html('');
  $user.append($('<td>').append($('<img>').addClass('img-rounded').attr('src', user.photo)));
  $user.append($('<td>').html(user.firstName));
  $user.append($('<td>').html(user.lastName));

  $user
    .css('cursor', 'pointer')
    .click(() => openUrl('https://vk.com/id' + user.id));

  // friends
  const $friends = $('#friends')
    .html('');

  user.friends.forEach((friend, index) => {
    const $friend = $('<tr>');

    $friend.append($('<td>').html(index + 1));
    $friend.append($('<td>').append($('<img>').addClass('img-rounded').attr('src', friend.photo)));
    $friend.append($('<td>').html(friend.firstName));
    $friend.append($('<td>').html(friend.lastName));
    $friend.append($('<td>').html(friend.wallLikeCount));

    $friends.append($friend);

    $friend
      .css('cursor', 'pointer')
      .click(() => openUrl('https://vk.com/id' + friend.id));
  });

  $('#result').css('display', '');
}

function openUrl(url) {
  var win = window.open(url, '_blank');
  if (win) {
    win.focus();
  } else {
    alert('Please allow popups for this website');
  }
}
