   �      7https://smartfile.slack.com/templates.php?cb=1445444831 %�'�L�    �����         
     O K           �   	   Cache-Control   max-age=315360000, public   Content-Encoding   gzip   Content-Security-Policy   referrer no-referrer;   Content-Type   	text/html   Expires   Fri, 10 Jan 2020 23:30:00 GMT   Server   Apache   Strict-Transport-Security   ,max-age=31536000; includeSubDomains; preload   Vary   Accept-Encoding   X-Frame-Options   
SAMEORIGIN <script id="channel_list_template" type="text/x-handlebars-template">{{#each channels}}
	{{> channel}}
{{/each}}

{{#feature flag="feature_private_channels"}}{{else}}
{{#if non_member_cnt}}
	{{#unless user.is_restricted}}
	<a class="channel-list-more list_more">+{{non_member_cnt}} More...</a>
	{{/unless}}
{{else}}
	{{#canUserCreateChannels}}
	<a class="channel-list-create list_more">Create a channel...</a>
	{{/canUserCreateChannels}}
{{/if}}
{{/feature}}
</script>
<script id="group_template" type="text/x-handlebars-template">	<li class='{{makeGroupDomId group}} group {{makeGroupDomClass group}} cursor_pointer'>
		<a class="group_name" data-group-id="{{group.id}}">
			{{#if show_symbol}}<i class="ts_icon ts_icon_lock prefix"></i>{{/if}}
			{{#feature flag='feature_private_channels'}}{{else}}<i class="ts_icon ts_icon_times_circle group_close"></i>{{/feature}}
			<span class="{{makeUnreadJustDomId group}} unread_just {{#if_equal group.unread_cnt compare=0}}hidden{{/if_equal}}">
				{{numberWithMax group.unread_cnt 10}}
			</span>
			<span class="{{makeUnreadHighlightDomId group}} unread_highlight {{#if_equal group.unread_highlight_cnt compare=0}}hidden{{/if_equal}}{{#if_equal group.unread_highlight_cnt compare=undefined}}hidden{{/if_equal}}">{{numberWithMax group.unread_highlight_cnt 10}}</span>
			<span class="overflow_ellipsis">
				{{#if group.is_archived}}(a) {{/if}}
				<span class="prefix">{{{groupPrefix}}}</span>
				{{group.name}}
			</span>
		</a>
	</li>	
</script>
<script id="channel_template" type="text/x-handlebars-template">	<li class="{{makeChannelDomId this}} channel {{makeChannelDomClass this}}">
		<a class="channel_name" data-channel-id="{{this.id}}">
			<span class="{{makeUnreadJustDomId this}} unread_just {{#if_equal this.unread_cnt compare=0}}hidden{{/if_equal}}">
				{{numberWithMax this.unread_cnt 10}}
			</span>
			<span class="{{makeUnreadHighlightDomId this}} unread_highlight {{#if_equal this.unread_highlight_cnt compare=0}}hidden{{/if_equal}}">
				{{numberWithMax this.unread_highlight_cnt 10}}
			</span>
			<span class="overflow_ellipsis">
				{{#if this.is_archived}}(a) {{/if}}
				<span class="prefix">#</span>
				{{this.name}}
			</span>
		</a>
	</li>
</script>
<script id="member_template" type="text/x-handlebars-template">	<li class='{{makeMemberDomId member}} member {{makeMemberDomClass member}} cursor_pointer'>
		{{! NOTE: we add user_colored and nuc classes to disallow/allow the color to be applied via the css rule (with :not(.nuc)), and easily toggle that on and off}}
		<a class="im_name {{#if color_names}}user_colored{{else}}nuc{{/if}} {{getMemberColorClassByImId im.id}}" data-member-id="{{member.id}}">
			{{#if show_close_link}}<i class="ts_icon ts_icon_times_circle im_close"></i>{{/if}}
			<span class="{{makeUnreadHighlightDomId member}} unread_highlight {{#if_equal im.unread_cnt compare=0}}hidden{{/if_equal}}{{#if_equal im.unread_cnt compare=undefined}}hidden{{/if_equal}}">{{numberWithMax im.unread_cnt 10}}</span>
			<span class="typing_indicator"></span>
			<span class="overflow_ellipsis">
				{{#if_equal im.name compare="slackbot"}}
					<i class="ts_icon ts_icon_heart slackbot_icon"></i>
					{{im.name}}
				{{else}}
					{{{makeMemberPresenceIcon member}}}
					{{getDisplayNameOfUserForIm im}}
				{{/if_equal}}
			</span>
		</a>
	</li>	
</script>
<script id="channel_members_list_template" type="text/x-handlebars-template">	{{#if members}}
		<ul id="{{makeChannelListDomId channel}}" class='member_list overflow_ellipsis'>			
			{{#each members}}
				<li class="{{makeMemberDomId this}} overflow_ellipsis member" data-member-id="{{this.id}}">
					<span class="typing_indicator"></span>
					<a href="/team/{{this.name}}" class="{{makeMemberPresenceDomClass this}} {{makeMemberListDomClass this}} {{getMemberColorClassById this.id}} {{#if ../color_names}}user_colored{{else}}nuc{{/if}} overflow_ellipsis">
						{{{makeMemberPresenceIcon this}}}
						{{getMemberDisplayName this}}
					</a>
				</li>
			{{/each}}
		</ul>
	{{/if}}
</script>
<script id="channel_create_overlay_template" type="text/x-handlebars-template">	<div id="channel_created" class="channel_overlay">
		<p class="channel_overlay_title">
			You just created<br />
			<span class="channel_overlay_title_prefix">#</span><strong>{{channel.name}}</strong>
		</p>
		<ul>
			{{#if_gt channel.active_members.length compare=1}}
				<li>{{channel.active_members.length}} people have this channel open.</li>
			{{else}}
				<li>You are currently the only person in this channel.</li>
			{{/if_gt}}
			<li>You can review messages from this channel in the <a href="/archives/{{channel.name}}" class="bold" target={{newWindowName}}>Channel Archive</a>.</li>
			<li>Others on your team can join from the <strong>Channel List</strong>.</li>
			<li>Or, you can <a class="bold invite_link">invite some teammates now</a>!</li>
		</ul>

		<label class="checkbox overlay_pref block">
			<input id="no_created_overlays_cb" type="checkbox" /> Don't show me this message when I create a {{channelOrGroupCopy}}
		</label>

		<a class="btn padded">Got it!</a>

		<p class="hidden" aria-hidden="false">
			Press enter to close this message and view the channel.
		</p>
		
	</div>
</script>
<script id="channel_join_overlay_template" type="text/x-handlebars-template">	<div id="channel_joined" class="channel_overlay">
		<p class="channel_overlay_title">
			You just joined<br />
			<span class="channel_overlay_title_prefix">#</span><strong>{{channel.name}}</strong>
		</p>
		<ul>
			<li>Created on {{toCalendarDate channel.created}} {{#if channel.creator}}by {{{makeMemberPreviewLinkById channel.creator}}}{{/if}}.</li>
			{{#if invited}}
				<li>{{#if channel.inviter}}You were invited to this channel by {{{makeMemberPreviewLinkById channel.inviter}}}.{{/if}}</li>
			{{/if}}
			{{#if_equal channel.active_members.length compare=1}}
				<li>You are currently the only person in this channel.</li>
			{{else}}
				<li>{{channel.active_members.length}} people have this channel open.</li>
			{{/if_equal}}
		</ul>
		{{#if channel.purpose.value}}
			<p class="channel_overlay_purpose">The purpose of this channel is:<br /><em>{{{formatTopicOrPurpose channel.purpose.value}}}</em></p>
		{{/if}}

		<label class="checkbox overlay_pref block">
			<input id="no_joined_overlays_cb" type="checkbox" /> Don't show me this message when I join a {{channelOrGroupCopy}}
		</label>

		<a class="btn padded">Got it!</a>

		<p class="hidden" aria-hidden="false">
			Press enter to close this message and view the channel.
		</p>
		
	</div>
</script>

<script id="group_create_overlay_template" type="text/x-handlebars-template">	<div id="group_created" class="channel_overlay">
		<p class="channel_overlay_title">
			You just created<br />
			<span class="channel_overlay_title_prefix">{{{groupPrefix}}}</span><strong>{{group.name}}</strong></span>
		</p>
		<ul>
			{{#if_gt group.active_members.length compare=1}}
				<li>{{group.active_members.length}} people have this {{groupCopy}} open.</li>
			{{else}}
				<li>You are currently the only person in this {{groupCopy}}.</li>
			{{/if_gt}}
			<li>You can invite other people from the {{groupCopy skip_private=true}} menu, which you'll find at the top of this column.</li>
			<li>You can review messages from this {{groupCopy skip_private=true}} in the <a href="/archives/{{group.name}}" class="bold" target={{newWindowName}}>{{groupCopy skip_private=true caps=true}} Archive</a>.</li>
		</ul>

		<label class="checkbox overlay_pref block">
			<input id="no_created_overlays_cb" type="checkbox" />
			Don't show me this message when I create a {{channelOrGroupCopy}}
		</label>

		<a class="btn padded">Got it!</a>

		<p class="hidden" aria-hidden="false">
			Press enter to close this message and view the {{groupCopy skip_private=true}}.
		</p>
		
	</div>
</script>
<script id="group_join_overlay_template" type="text/x-handlebars-template">	<div id="group_joined" class="channel_overlay">
		<p class="channel_overlay_title">
			You just joined<br />
			<span class="channel_overlay_title_prefix">{{{groupPrefix}}}</span><strong>{{group.name}}</strong>
		</p>
		<ul>
			<li>Created on {{toCalendarDate group.created}} {{#if group.creator}}by {{{makeMemberPreviewLinkById group.creator}}}{{/if}}.</li>
			<li>This is a {{privateGroupCopy}}.</li>
			{{#if invited}}
				<li>{{#if group.inviter}}You were invited to this {{groupCopy skip_private=true}} by {{{makeMemberPreviewLinkById group.inviter}}}.{{/if}}</li>
			{{/if}}
			{{#if_equal group.active_members.length compare=1}}
				<li>You are currently the only member of this {{groupCopy skip_private=true}}.</li>
			{{else}}
				<li>The members are
				{{#foreach group.active_members}}
					{{#if this.last}}and {{/if}}{{getMemberDisplayNameById this.value}}{{#if this.last}}.{{else}}{{#if_gt this.length compare=2}},{{/if_gt}}{{/if}}
				{{/foreach}}</li>
			{{/if_equal}}
			<li>Only members can open the {{groupCopy skip_private=true}} and they are the only ones to have access to the archives.</li>
			<li>You can invite more members from the {{groupCopy skip_private=true}} menu.</li>
		</ul>
		{{#if group.purpose.value}}
			<p class="channel_overlay_purpose">The purpose of this {{groupCopy skip_private=true}} is:<br /><em>{{{formatTopicOrPurpose group.purpose.value}}}</em></p>
		{{/if}}

		<label class="checkbox overlay_pref block">
			<input id="no_joined_overlays_cb" type="checkbox" /> Don't show me this message when I join a {{channelOrGroupCopy}}
		</label>

		<a class="btn padded">Got it!</a>

		<p class="hidden" aria-hidden="false">
			Press enter to close this message and view the {{groupCopy skip_private=true}}.
		</p>
		
	</div>
</script>

	<script id="mpim_template" type="text/x-handlebars-template"><li class="mpim {{makeMpimDomClass mpim}} {{makeMpimDomId mpim}}">
	<a class="mpim_name" data-mpim-id="{{mpim.id}}">
		<i class="ts_icon ts_icon_multiparty_dm_{{mpimMemberCount mpim}} prefix"></i>
		<i class="ts_icon ts_icon_times_circle mpim_close"></i>
		{{#isCorGMuted mpim.id}}
			<span class="{{makeUnreadHighlightDomId mpim}} unread_highlight {{#if_equal mpim.unread_highlight_cnt compare=0}}hidden{{/if_equal}}{{#if_equal mpim.unread_highlight_cnt compare=undefined}}hidden{{/if_equal}}">{{numberWithMax mpim.unread_highlight_cnt 10}}</span>
		{{else}}
			<span class="{{makeUnreadHighlightDomId mpim}} unread_highlight {{#if_equal mpim.unread_cnt compare=0}}hidden{{/if_equal}}{{#if_equal mpim.unread_cnt compare=undefined}}hidden{{/if_equal}}">{{numberWithMax mpim.unread_cnt 10}}</span>
		{{/isCorGMuted}}
		<span class="overflow_ellipsis">
			{{mpimDisplayName mpim}}
		</span>
	</a>
</li></script>
	<script id="mpim_link_template" type="text/x-handlebars-template"><a href="{{href}}" {{#if target}}target="{{target}}"{{/if}} class="mpim_link inline {{#if title}}ts_tip ts_tip_top ts_tip_leftish ts_tip_float ts_tip_multiline{{/if}}">
	{{mpimDisplayName mpim}}
	{{#if title}}
		<span class="ts_tip_tip"><span class="ts_tip_multiline_inner">{{title}}</span></span>
	{{/if}}
</a></script>
	<script id="mpim_header_template" type="text/x-handlebars-template">{{{star 'mpim' model_ob}}}
<span class="name overflow_ellipsis {{#if title}}ts_tip ts_tip_bottom ts_tip_float ts_tip_multiline{{/if}} {{#if is_muted}}muted{{/if}}">
	<span class="prefix">
		{{~#if is_muted~}}
			{{~#if is_safari_desktop~}}
				<i class="ts_icon ts_icon_bell_slash muted_icon" style="margin-top: -6px;"></i> 
			{{~else~}}
				<i class="ts_icon ts_icon_bell_slash muted_icon"></i> 
			{{~/if~}}
		{{~/if~}}
	</span>{{{mpimDisplayName model_ob true}}}
	{{#if title}}<span class="ts_tip_tip"><span class="ts_tip_multiline_inner">{{title}}</span></span>{{/if}}
</span>
<i id="mpim_actions" class="ts_icon ts_icon_chevron_down ts_icon_inherit"></i></script>

<script id="file_header_template" type="text/x-handlebars-template">	<div class="flexpane_file_title">

		{{#feature flag="feature_email_integration"}}
			{{makeProfileImage member size=36}}
		{{else}}
			{{{makeMemberPreviewLinkImage member.id 36}}}
		{{/feature}}

		<span class="{{getMemberColorClassById member.id}}">{{{makeMemberPreviewLink member}}}</span>

		<span class="title break_word">
			{{#if is_post_or_space}}
				{{#if preview}}
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.id}}"{{/isClient}} data-file-id="{{file.id}}" class="file_new_window_link">{{makeFilePrivacyLabel file}} Post</a>
				{{else}}
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.id}}"{{/isClient}} data-file-id="{{file.id}}" class="file_new_window_link">{{{highlightSearchMatchesInFileTitle file.title}}}</a>
				{{/if}}
			{{else}}
				<a href="{{file.permalink}}" {{#isClient}}target="{{file.id}}"{{/isClient}} data-file-id="{{file.id}}" {{#unless preview}}class="file_preview_link"{{/unless}}>{{{highlightSearchMatchesInFileTitle file.title}}}</a>
			{{/if}}

			<span class="no_wrap">
				{{{star 'file' file null}}}
			</span>
		</span>

	{{#isClient}}
		<ul class="file_action_list no_bullets no_bottom_margin float_right">

			{{#if download}}
				<li class="file_action_item inline_block">
					<a class="ts_tip ts_tip_bottom file_ssb_download_link" data-file-id="{{file.id}}" href="{{file.url_private_download}}" target="{{newWindowName}}">
						<span class="ts_tip_btn ts_icon ts_icon_cloud_download"></span>
						<span class="ts_tip_tip">Download</span>
					</a>
				</li>
			{{/if}}

			{{#if edit}}
				<li class="file_action_item inline_block">
					<a data-file-id="{{file.id}}" class="ts_tip ts_tip_bottom file file_new_window_link{{#if is_snippet}} snippet_edit_dialog_link{{/if}}"
						href="{{edit_link}}" target="{{edit_link}}"
					>
						<span class="ts_tip_btn ts_icon ts_icon_pencil"></span>
						<span class="ts_tip_tip">Edit</span>
					</a>
				</li>
			{{else}}

				<li class="file_action_item inline_block">
					{{#if file.is_external}}
						<a class="ts_tip ts_tip_bottom ts_tip_rightish" href="{{fileUrl file}}" target="{{newWindowName}}">
							<span class="ts_tip_btn ts_icon ts_icon_external_link"></span>
							<span class="ts_tip_tip">
								Open file on
								{{#if_equal file.external_type compare="gdrive"}}
									Google Drive
								{{/if_equal}}
								{{#if_equal file.external_type compare="dropbox"}}
									Dropbox
								{{/if_equal}}
								{{#if_equal file.external_type compare="box"}}
									Box
								{{/if_equal}}
								{{#if_equal file.external_type compare="onedrive"}}
									OneDrive
								{{/if_equal}}
								{{#if_equal file.external_type compare="unknown"}}
									a web page
								{{/if_equal}}
							</span>
						</a>
					{{else}}
						{{#fileIsImage id=file.id}}
							<a class="ts_tip ts_tip_bottom ts_tip_rightish" href="{{file.url_private}}" target="{{file.id}}">
								<span class="ts_tip_btn ts_icon ts_icon_external_link"></span>
								<span class="ts_tip_tip">Open in new window</span>
							</a>
						{{else}}
							<a class="ts_tip ts_tip_bottom ts_tip_rightish file_new_window_link" href="{{file.permalink}}" target="{{file.permalink}}" data-file-id="{{file.id}}">
								<span class="ts_tip_btn ts_icon ts_icon_external_link"></span>
								<span class="ts_tip_tip">Open in new window</span>
							</a>
						{{/fileIsImage}}
					{{/if}}
					</a>
				</li>
			{{/if}}

			<li class="file_action_item inline_block">
				<a class="ts_tip ts_tip_bottom ts_tip_right file_actions" data-file-id="{{file.id}}"
					data-exclude-comment="true"
					data-include-copy-file-link="true"
					data-include-view-public-link="true"
					{{#if download}}data-exclude-download="true"{{/if}}
					{{#if_not_equal file.mode compare="email"}}{{#if_not_equal file.mode compare="snippet"}}data-exclude-original="true"{{/if_not_equal}}{{/if_not_equal}}
					{{#if edit}}data-exclude-edit="true"{{/if}}
				>
					<span class="ts_tip_btn ts_icon ts_icon_ellipsis_o"></span>
					<span class="ts_tip_tip">More actions</span>
				</a>
			</li>
		</ul>
	{{/isClient}}

	</div>{{!--/file_header--}}

</script>
<script id="file_list_item_template" type="text/x-handlebars-template"><div id="{{makeFileDomId file}}" class="file_list_item file_item {{file.mode}} {{#if is_hosted_or_external}}{{#if file.thumb_80}}has_image{{else}}has_icon{{/if}}{{else}}has_icon{{/if}}" data-file-id="{{file.id}}">

	{{#if for_files_list}}

		<div class="actions">
			{{#isClient}}
				{{#if can_share}}
					<button class="file_share btn_icon btn_outline btn ts_icon ts_icon_share ts_tip_btn ts_tip ts_tip_top" data-file-id="{{file.id}}">
						<div class="ts_tip_tip">Share</div>
					</button>
				{{/if}}
				<button class="file_actions btn_icon btn_outline btn ts_icon ts_icon_ellipsis ts_tip_btn ts_tip ts_tip_top" data-file-id="{{file.id}}" data-include-copy-file-link="true" data-include-view-public-link="true">
					<div class="ts_tip_tip">{{#feature flag="feature_channel_details"}}{{#if info_pane_visible}}File{{else}}More{{/if}}{{else}}More{{/feature}} actions</div>
				</button>
			{{/isClient}}

			<button class="file_star btn_icon btn btn_outline ts_tip_btn ts_tip ts_tip_top">
				{{{star 'file' file null}}}
				<div class="star_message ts_tip_tip">Star</div>
				<div class="unstar_message ts_tip_tip">Unstar</div>
			</button>
		</div>

		{{#if is_email}}
			<i class="filetype_icon s30 email"></i>
		{{/if}}

		{{#if is_post}}
			<i class="filetype_icon s30 post"></i>
		{{/if}}

		{{#if is_space}}
			<i class="filetype_icon s30 post"></i>
		{{/if}}

		{{#if is_snippet}}
			<i class="filetype_icon s30 {{#if_equal file.mode compare="snippet"}}{{#if_equal file.filetype compare="text"}}snippet{{else}}{{file.filetype}}{{/if_equal}}{{else}}{{file.filetype}}{{/if_equal}}"></i>
		{{/if}}

		{{#if is_hosted_or_external}}
			{{#if file.thumb_80}}
				{{#if_equal icon_class compare="thumb_80"}}
					<i data-original="{{#if file.thumb_160}}{{file.thumb_160}}{{else}}{{file.thumb_80}}{{/if}}" class="filetype_image lazy"></i>
				{{else}}
					<i data-original="url({{file.thumb_360}})" class="filetype_image lazy"></i>
				{{/if_equal}}
			{{else}}
				<i data-file-id="{{file.id}}" class="filetype_icon s30 {{file.filetype}}"></i>
			{{/if}}
		{{/if}}

		<div class="contents">

			<span class="author">{{{makeMemberPreviewLink member}}}</span>
			<span class="time">{{toCalendarDateOrNamedDayShort file.timestamp}} at {{toTime file.timestamp}}</span>

			<h4 class="title {{#if supports_line_clamp}}{{else}}overflow_ellipsis{{/if}} {{#unless file.plain_text}}{{#unless file.preview_in_list}}{{#unless file.preview}}no_preview{{/unless}}{{/unless}}{{/unless}}">{{{highlightSearchMatchesInFileTitle file.title}}}</h4>



			{{#if is_email}}
				{{#if file.preview_plain_text}}
					<p class="email_preview_text">
						{{file.preview_plain_text}}
					</p>
				{{/if}}
			{{/if}}

			{{#if is_post}}
				{{#if file.preview_in_list}}
					<p class="preview {{#if supports_line_clamp}}{{else}}overflow_ellipsis{{/if}}">
						{{{smartnl2br file.preview_in_list}}}
					</p>
				{{/if}}
			{{/if}}

			{{#if is_space}}
				{{#if file.preview_in_list}}
					<div class="preview post_body {{#if supports_line_clamp}}{{else}}overflow_ellipsis{{/if}}">
						{{{formatSpaceHtml file.preview_in_list}}}
					</div>
				{{/if}}
			{{/if}}

			{{#if is_snippet}}
				{{#if file.preview}}
					<div class="snippet_preview monospace {{#if supports_line_clamp}}{{else}}overflow_ellipsis{{/if}}">
						{{file.preview}}
					</div>
				{{/if}}
			{{/if}}

			{{#if file.comments_count}}
				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link no_wrap tiny_right_margin">{{#if_gt file.comments_count compare="0"}}{{file.comments_count}}{{/if_gt}} <i class="ts_icon ts_icon_comment"></i></a>
			{{/if}}

			<span class="share_info">
				<span class="file_share_public_label{{#unless file.is_public}} hidden{{/unless}}" data-file-id="{{file.id}}">
					<span class="file_share_shared_label{{#unless file.is_shared}} hidden{{/unless}}" data-file-id="{{file.id}}">
						Shared {{{makeFileShareLabel file}}}
					</span>
				</span>
				<span class="file_share_private_label {{#if file.is_public}} hidden{{/if}}" data-file-id="{{file.id}}">
					Private file {{{makeFileShareLabel file}}}
				</span>
			</span>

		</div>

	{{else}}

		<div class="actions">
			{{{star 'file' file null}}}
			{{#isClient}}
				{{#if can_share}}<a class="file_share ts_icon ts_icon_share" data-file-id="{{file.id}}"></a>{{/if}}
				<a class="file_actions ts_icon ts_icon_ellipsis" data-file-id="{{file.id}}"></a>
			{{/isClient}}
		</div>

		{{#if is_email}}
			<i class="filetype_icon s24 email"></i>
		{{/if}}

		{{#if is_post}}
			<i class="filetype_icon s24 post"></i>
		{{/if}}

		{{#if is_space}}
			<i class="filetype_icon s24 post"></i>
		{{/if}}

		{{#if is_snippet}}
			<i class="filetype_icon s24 {{#if_equal file.mode compare="snippet"}}{{#if_equal file.filetype compare="text"}}snippet{{else}}{{file.filetype}}{{/if_equal}}{{else}}{{file.filetype}}{{/if_equal}}"></i>
		{{/if}}

		{{#if is_hosted_or_external}}
			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link icon {{icon_class}}">
				{{#if file.thumb_80}}
					{{#if_equal icon_class compare="thumb_80"}}
						<img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=" data-original="{{#if file.thumb_160}}{{file.thumb_160}}{{else}}{{file.thumb_80}}{{/if}}" class="lazy" />
					{{else}}
						<img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=" data-original="{{file.thumb_360}}" class="lazy" />
					{{/if_equal}}
				{{else}}
					<span data-file-id="{{file.id}}" class="filetype_icon s48 {{file.filetype}}"></span>
				{{/if}}
			</a>
		{{/if}}

		<div class="contents">

			<div class="title break_word">
				<a href="{{file.permalink}}" {{#isClient}}target="{{file.id}}"{{/isClient}} data-file-id="{{file.id}}" {{#unless preview}}class="file_preview_link file_force_flexpane"{{/unless}}>{{{highlightSearchMatchesInFileTitle file.title}}}</a>
			</div>

			{{{makeMemberPreviewLink member}}}
			<span class="time"><span class="bullet">•</span> {{toCalendarDateOrNamedDayShort file.timestamp}} at {{toTime file.timestamp}}</span><br />

			{{#if file.comments_count}}
				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link no_wrap small_right_margin">{{#if_gt file.comments_count compare="0"}}{{file.comments_count}}{{/if_gt}} <i class="ts_icon ts_icon_comment"></i></a>
			{{/if}}

			<span class="share_info">
				<span class="file_share_public_label{{#unless file.is_public}} hidden{{/unless}}" data-file-id="{{file.id}}">
					<span class="file_share_shared_label{{#unless file.is_shared}} hidden{{/unless}}" data-file-id="{{file.id}}">
						shared {{{makeFileShareLabel file}}}
					</span>
				</span>
				<span class="file_share_private_label {{#if file.is_public}} hidden{{/if}}" data-file-id="{{file.id}}">
					private file {{{makeFileShareLabel file}}}
				</span>
			</span>

			{{#if is_email}}
				<p class="no_bottom_margin email_preview_text">
					{{file.preview_plain_text}}
				</p>
			{{/if}}

			{{#if is_post}}
				<p class="preview">
					{{#if for_search}}
						{{#if file.preview_search}}
							{{{nl2brAndHighlightSearchMatches file.preview_search}}}
						{{else}}
							{{{smartnl2br file.preview}}}
						{{/if}}
					{{else}}
						{{{smartnl2br file.preview}}}
					{{/if}}
				</p>
			{{/if}}

			{{#if is_space}}
				<div class="preview post_body">
					{{#if for_search}}
						{{#if file.preview_search}}
							{{{highlightSearchMatchesInSpacesHtml file.preview_search}}}
						{{else}}
							{{{formatSpaceHtml file.preview}}}
						{{/if}}
					{{else}}
						{{{formatSpaceHtml file.preview}}}
					{{/if}}
				</div>
			{{/if}}

			{{#if is_snippet}}
				<div class="snippet_preview">
					{{{file.preview_highlight}}}
					{{#if_gt file.lines_more compare=0}}
						<a href="{{file.permalink}}" data-file-id="{{file.id}}" class="file_preview_link snippet_preview_more" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link">+ {{file.lines_more}} more line{{#if_gt file.lines_more compare=1}}s{{/if_gt}}...</a>
					{{/if_gt}}
				</div>
			{{/if}}

		</div>

	{{/if}}

</div>
</script>
<script id="file_preview_head_template" type="text/x-handlebars-template">	<div id="file_title_container">
		{{{makeFilePreviewHeader file member}}}
	</div>

	<div id="file_edit_title_container" class="hidden">
		<form action="" id="file_edit_title_form" class="small_bottom_margin" method="post" onSubmit="TS.files.saveEditFileTitle('{{file.id}}'); return false;">
			{{! no need for crumb_input }}
			<p class="no_bottom_margin"><input type="text" id="file_edit_title_input" class="small" name="file_edit_title_input"></input></p>
			<p class="no_bottom_margin align_right">
				<button type="button" class="btn btn_small btn_outline" onClick="TS.files.endEditFileTitle(); return false;">Cancel</button>
				<button type="submit" class="btn btn_small">Save Changes</button>
			</p>
		</form>
	</div>

	{{#if file_partial}}
		{{> (concatStr 'file_' file_partial)}} {{!-- dynamically create the string "file_snippet" from "file_" and the template arg file_partial (snippet) --}}
	{{/if}}

	<div class="clear_both"></div>

	<p class="file_meta">

		<span class="date">{{toCalendarDateOrNamedDayShort file.timestamp}} at {{toTime file.timestamp}}</span>
		<span class="bullet">•</span>

		{{#if meta_filetype}}
			{{{meta_filetype}}}
			<span class="bullet">•</span>
		{{/if}}

		<span class="file_share_public_label inline_block{{#unless file.is_public}} hidden{{/unless}}" data-file-id="{{file.id}}">
			<span class="file_share_shared_label bold_share_labels{{#unless file.is_shared}} hidden{{/unless}}">Shared {{{makeFileShareLabel file}}}</span>
			<span class= "file_share_unshared_label{{#if file.is_shared}} hidden{{/if}}" data-file-id="{{file.id}}">
				Team file
			</span>
		</span>

		<span class="file_share_private_label inline_block{{#if file.is_public}} hidden{{/if}}" data-file-id="{{file.id}}">
			<i class="ts_icon ts_icon_eye ts_icon_inherit"></i>
			{{makeFilePrivacyLabel file}}
			{{#if_equal file.mode compare="email"}}
				email
			{{else}}
				{{#and (if_not_equal file.mode compare="post") (if_not_equal file.mode compare="space")}}
					{{#if_equal file.mode compare="snippet"}}snippet{{else}}file{{/if_equal}}
					{{{makeFileShareLabel file}}}
				{{/and}}
			{{/if_equal}}
		</span>

		{{#if file.public_url_shared}}
			<span class="bullet">•</span>
			<span class="file_share_public_link_label inline_block">
				{{> file_public_link}}
			</span>
		{{/if}}

	</p>

	{{{rxnPanel file._rxn_key rxn_options}}}

</script>
</script>
<script id="file_preview_head_section_old_template" type="text/x-handlebars-template">	<div id="file_title_container">
		{{{makeFilePreviewHeader file member}}}
	</div>

	<div id="file_edit_title_container" class="hidden">
		<form action="" id="file_edit_title_form" class="small_bottom_margin" method="post" onSubmit="TS.files.saveEditFileTitle('{{file.id}}'); return false;">
			{{! no need for crumb_input }}
			<p class="no_bottom_margin"><input type="text" id="file_edit_title_input" class="small" name="file_edit_title_input"></input></p>
			<p class="no_bottom_margin align_right">
				<button type="button" class="btn btn_small btn_outline" onClick="TS.files.endEditFileTitle(); return false;">Cancel</button>
				<button type="submit" class="btn btn_small">Save Changes</button>
			</p>
		</form>
	</div>

	{{#if file.thumb_360}}

		{{! opening a.file_preview_wrapper tag … }}
		<a href="{{file.url_private}}"
			target="{{file.url_private}}"
			style="width: {{file.thumb_360_w}}px;"

			{{#if file.is_external}}
				class="file_preview_wrapper no_underline {{file.filetype}} {{#if_equal file.external_type compare="dropbox"}}dropbox{{/if_equal}}"
			{{else}}
				{{#fileIsImage id=file.id}}
					class="file_preview_wrapper no_underline {{#if lightbox}}lightbox_link{{/if}}"
					title="{{#if lightbox}}Open in lightbox ({{#isMac}}cmd{{else}}ctrl{{/isMac}}+click to open original in new tab){{else}}{{#isMac}}cmd{{else}}ctrl{{/isMac}}+click to open original in new tab{{/if}}"
					data-file-id="{{file.id}}"
				{{else}}
					class="file_preview_wrapper no_underline {{file.filetype}}"
				{{/fileIsImage}}
			{{/if}}

		>{{! … opening a.file_preview_wrapper tag to here }}

			{{! for this padding-top all that matters is the aspect ratio is correct, so it doesn't matter which size thumbnail we grab the dimensions from as long as the % is correct }}
			<div
				class="file_preview_preserve_aspect_ratio"
				{{#if preserve_aspect_ratio}}
					style="padding-top: -webkit-calc( {{file.thumb_360_h}} / {{file.thumb_360_w}} * 100%); padding-top: -moz-calc( {{file.thumb_360_h}} / {{file.thumb_360_w}} * 100%); padding-top: calc( {{file.thumb_360_h}} / {{file.thumb_360_w}} * 100%);"
				{{else}}
					style="width: {{file.thumb_360_w}}px; height: {{file.thumb_360_h}}px;"
				{{/if}}
			>

				{{#if file.thumb_720}}
					<img src="{{#if file.thumb_360_gif}}{{file.thumb_360_gif}}{{else}}{{file.thumb_720}}{{/if}}" class="file_preview" {{#if file.thumb_360_gif}}{{else}}srcset="{{file.thumb_360}} 1x, {{file.thumb_720}} 2x"{{/if}} />
				{{else}}
					<img src="{{#if file.thumb_360_gif}}{{file.thumb_360_gif}}{{else}}{{file.thumb_360}}{{/if}}" class="file_preview" />
				{{/if}}

			</div>{{!--/file_preview_preserve_aspect_ratio--}}

			{{#if file.is_external}}
				{{#if_equal file.external_type compare="dropbox"}}
					<div class="dropbox_banner">
						<i class="ts_icon ts_icon_dropbox ts_icon_inherit small_right_margin"></i> Open in Dropbox</div>
					</div>
				{{/if_equal}}
			{{/if}}

		</a>{{!--/file_preview_wrapper--}}

	{{else}}

		<a	target="{{file.id}}"
			data-file-id="{{file.id}}"
			{{#if file.is_external}}
				href="{{fileUrl file}}"
				class="filetype_button"
			{{else}}
				{{#if_equal file.filetype compare='pdf'}}
					href="{{file.url_private}}"
					class="filetype_button"
				{{else}}
					{{#if_equal file.filetype compare='space'}}
						href="{{file.permalink}}"
						class="filetype_button"
					{{else}}
						href="{{file.url_private_download}}"
						class="filetype_button file_ssb_download_link"
					{{/if_equal}}
				{{/if_equal}}
			{{/if}}
		>
			<i class="filetype_icon {{file.filetype}} s48"></i>
			<span class="filetype_label">
				{{convertFilesize file.size}}<br />
				<span>{{file.pretty_type}}</span> {{#if_equal file.filetype compare='rtf'}}{{else}}File{{/if_equal}}
			</span>
			<span class="file_download_label" data-file-id="{{file.id}}">
				{{#if file.is_external}}
					{{#if_equal file.external_type compare="gdrive"}}
						Open in Google Drive
					{{/if_equal}}
					{{#if_equal file.external_type compare="dropbox"}}
						Open in Dropbox
					{{/if_equal}}
					{{#if_equal file.external_type compare="box"}}
						Open in Box
					{{/if_equal}}
					{{#if_equal file.external_type compare="onedrive"}}
						Open in OneDrive
					{{/if_equal}}
				{{else}}
					{{#if_equal file.filetype compare='pdf'}}
						Open original in new window
					{{else}}
						{{#if_equal file.filetype compare='space'}}
							Open Space
						{{else}}
							<i class="ts_icon ts_icon_arrow_circle_o_down small_right_margin"></i> Download File
						{{/if_equal}}
					{{/if_equal}}
				{{/if}}
			</span>
		</a>

	{{/if}}

	<div class="clear_both"></div>

	<p class="file_page_meta">

		<span class="date">{{toCalendarDateOrNamedDayShort file.timestamp}} at {{toTime file.timestamp}}</span>
		<span class="bullet">•</span>

		{{#if file.is_external}}
			{{{external_filetype_html}}}
		{{else}}
			<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" title="Download this file" data-file-id="{{file.id}}" class="subtle_silver file_ssb_download_link">{{convertFilesize file.size}} <span>{{file.pretty_type}}</span></a>
		{{/if}}

		<span class="bullet">•</span>

		{{{fileActionsLink file}}}
		<br />

		<span class="file_share_public_label{{#unless file.is_public}} hidden{{/unless}}" data-file-id="{{file.id}}">
			<span class="file_share_shared_label{{#unless file.is_shared}} hidden{{/unless}}">Shared {{{makeFileShareLabel file}}}</span>
			<span class= "file_share_unshared_label{{#if file.is_shared}} hidden{{/if}}" data-file-id="{{file.id}}">
				Team file
			</span>
		</span>

		<span class="file_share_private_label{{#if file.is_public}} hidden{{/if}}" data-file-id="{{file.id}}">
			<i class="ts_icon ts_icon_eye ts_icon_inherit"></i> Private file {{{makeFileShareLabel file}}}
		</span>

		{{#if file.public_url_shared}}
			<span class="bullet">•</span>
			{{> file_public_link}}
		{{/if}}

	</p>

	{{{rxnPanel file._rxn_key rxn_options}}}

</script>
</script>

<script id="file_post_preview_head_section_old_template" type="text/x-handlebars-template">	{{{makeFilePreviewHeader file member}}}
	
	<h3 class="small_bottom_margin"><a href="{{file.permalink}}" {{#isClient}}target="{{file.id}}"{{/isClient}} data-file-id="{{file.id}}" class="indifferent_grey">{{{highlightSearchMatchesInFileTitle file.title}}}</a></h3>

	<div class="post_body">{{{file.content_html}}}</div>

	<p class="file_page_meta no_bottom_margin">

		<span class="date">{{toCalendarDateOrNamedDayShort file.timestamp}} at {{toTime file.timestamp}}</span>

		<span class="bullet">•</span>
		{{{fileActionsLink file}}}
		
	</p>

	<p class="file_page_meta no_bottom_margin">
		<span class="file_share_public_label{{#unless file.is_public}} hidden{{/unless}}" data-file-id="{{file.id}}">
			<span class="file_share_shared_label{{#unless file.is_shared}} hidden{{/unless}}" data-file-id="{{file.id}}">
				Shared {{{makeFileShareLabel file}}}
			</span>
		</span>
		<span class="file_share_private_label{{#if file.is_public}} hidden{{/if}}" data-file-id="{{file.id}}">
			<i class="ts_icon ts_icon_eye ts_icon_inherit"></i>
			{{makeFilePrivacyLabel file}}
			{{#unless member.is_self}}post shared with you{{/unless}}
		</span>
		
		{{#if file.public_url_shared}}
			<span class="bullet">•</span>
			{{> file_public_link}}
		{{/if}}
		
	</p>
	
	{{{rxnPanel file._rxn_key rxn_options}}}
			
</script>
<script id="file_space_preview_head_section_old_template" type="text/x-handlebars-template">	{{{makeFilePreviewHeader file member}}}

	{{#feature flag="feature_fix_files"}}{{else}}

		<h3 class="small_bottom_margin"><a href="{{file.permalink}}" {{#isClient}}target="{{file.id}}"{{/isClient}} data-file-id="{{file.id}}" class="indifferent_grey file_new_window_link">{{{highlightSearchMatchesInFileTitle file.title}}}</a></h3>

		<div class="post_body">{{{formatSpaceHtml file.content_html}}}</div>

	{{/feature}}

	<p class="file_page_meta{{#feature flag="feature_fix_files"}}{{else}} no_bottom_margin{{/feature}}">

		<span class="date">{{toCalendarDateOrNamedDayShort file.timestamp}} at {{toTime file.timestamp}}</span>
		<span class="bullet">•</span>

		{{#feature flag="feature_fix_files"}}{{else}}
			{{{fileActionsLink file}}}
		{{/feature}}

		{{#feature flag="feature_fix_files"}}{{else}}</p><p class="file_page_meta no_bottom_margin">{{/feature}}

		<span class="file_share_public_label{{#feature flag="feature_fix_files"}} inline_block{{/feature}}{{#unless file.is_public}} hidden{{/unless}}" data-file-id="{{file.id}}">
			<span class="file_share_shared_label{{#unless file.is_shared}} hidden{{/unless}}{{#feature flag="feature_fix_files"}} bold_share_labels{{/feature}}" data-file-id="{{file.id}}">
				Shared {{{makeFileShareLabel file}}}
			</span>
		</span>
		<span class="file_share_private_label{{#feature flag="feature_fix_files"}} inline_block{{/feature}}{{#if file.is_public}} hidden{{/if}}" data-file-id="{{file.id}}">
			<i class="ts_icon ts_icon_eye ts_icon_inherit"></i>
			{{makeFilePrivacyLabel file}}
			{{#unless member.is_self}}space shared with you{{/unless}}
		</span>
		
		{{#if file.public_url_shared}}
			<span class="bullet">•</span>
			{{#feature flag="feature_fix_files"}}{{else}}<span class="inline_block">{{/feature}}
				{{> file_public_link}}
			{{#feature flag="feature_fix_files"}}{{else}}</span>{{/feature}}
		{{/if}}
		
	</p>
	
	{{{rxnPanel file._rxn_key rxn_options}}}
			
</script>
<script id="file_snippet_preview_head_section_old_template" type="text/x-handlebars-template">	{{{makeFilePreviewHeader file member}}}

	{{#feature flag='feature_fix_files'}}{{else}}

		<pre id="{{makeFileContentsDomId file}}{{plus}}">{{#if file.content}}{{file.content}}{{else}}loading...{{/if}}</pre>

		<div class="file_page_meta" id="truncated_message"><i class="ts_icon ts_icon_info_circle"></i> This snippet was truncated for display: <a href="{{file.url_private}}" target="{{file.url_private}}">see it in full</a>.</div>

		<label class="checkbox normal mini float_right no_top_padding no_right_margin no_min_width">
			<input type="checkbox" id="file_preview_wrap_cb"> wrap
		</label>

	{{/feature}}

	<p class="file_page_meta{{#feature flag="feature_fix_files"}}{{else}} no_bottom_margin" style="margin-right: 3.5rem;{{/feature}}">
		<span class="date">{{toCalendarDateOrNamedDayShort file.timestamp}} at {{toTime file.timestamp}}</span>
		<span class="bullet">•</span>

		<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" title="Download this file">{{convertFilesize file.size}} <span>{{file.pretty_type}}</span> snippet</a>
		<span class="bullet">•</span>

		{{#feature flag="feature_fix_files"}}{{else}}
			{{{fileActionsLink file}}}
		{{/feature}}

		{{#feature flag="feature_fix_files"}}{{else}}</p><p class="file_page_meta">{{/feature}}

		<span class="file_share_public_label{{#feature flag="feature_fix_files"}} inline_block{{/feature}}{{#unless file.is_public}} hidden{{/unless}}" data-file-id="{{file.id}}">
			<span class="file_share_shared_label{{#unless file.is_shared}} hidden{{/unless}}{{#feature flag="feature_fix_files"}} bold_share_labels{{/feature}}" data-file-id="{{file.id}}">
				Shared {{{makeFileShareLabel file}}}
			</span>
		</span>
		<span class="file_share_private_label{{#feature flag="feature_fix_files"}} inline_block{{/feature}}{{#if file.is_public}} hidden{{/if}}" data-file-id="{{file.id}}">
			<i class="ts_icon ts_icon_eye ts_icon_inherit"></i> Private snippet {{{makeFileShareLabel file}}}
		</span>

		{{#if file.public_url_shared}}
			<span class="bullet">•</span>
			{{#feature flag="feature_fix_files"}}{{else}}<span class="inline_block">{{/feature}}
				{{> file_public_link}}
			{{#feature flag="feature_fix_files"}}{{else}}</span>{{/feature}}
		{{/if}}
	</p>

	{{{rxnPanel file._rxn_key rxn_options}}}
</script>
<script id="file_email_preview_head_section_old_template" type="text/x-handlebars-template">	<div id="file_title_container">
		{{{makeFilePreviewHeader file member}}}
	</div>

	<div id="file_edit_title_container" class="hidden">
		<form action="" id="file_edit_title_form" class="small_bottom_margin" method="post" onSubmit="TS.files.saveEditFileTitle('{{file.id}}'); return false;">
			{{! no need for crumb_input }}
			<p class="no_bottom_margin"><input type="text" id="file_edit_title_input" class="small" name="file_edit_title_input"></input></p>
			<p class="no_bottom_margin align_right">
				<button type="button" class="btn btn_small btn_outline" onClick="TS.files.endEditFileTitle(); return false;">Cancel</button>
				<button type="submit" class="btn btn_small">Save Changes</button>
			</p>
		</form>
	</div>

	{{{email_html}}}

	<p class="file_page_meta{{#feature flag="feature_fix_files"}}{{else}} no_bottom_margin{{/feature}}">

		<span class="date">{{toCalendarDateOrNamedDayShort file.timestamp}} at {{toTime file.timestamp}}</span>

		<span class="bullet">•</span>

		{{#feature flag="feature_fix_files"}}{{else}}
			{{{fileActionsLink file}}}
			<br />
		{{/feature}}

		<span class="file_share_public_label{{#feature flag="feature_fix_files"}} inline_block{{/feature}}{{#unless file.is_public}} hidden{{/unless}}" data-file-id="{{file.id}}">
			<span class="file_share_shared_label{{#unless file.is_shared}} hidden{{/unless}}{{#feature flag="feature_fix_files"}} bold_share_labels{{/feature}}" data-file-id="{{file.id}}">
				Shared {{{makeFileShareLabel file}}}
			</span>
		</span>
		<span class="file_share_private_label{{#feature flag="feature_fix_files"}} inline_block{{/feature}}{{#if file.is_public}} hidden{{/if}}" data-file-id="{{file.id}}">
			<i class="ts_icon ts_icon_eye ts_icon_inherit"></i> Private email {{{makeFileShareLabel file}}}
		</span>

	</p>

	{{{rxnPanel file._rxn_key rxn_options}}}

</script>

<script id="file_sharing_template" type="text/x-handlebars-template">	<div id="file_sharing_div" class="{{#feature flag='feature_private_channels'}}feature_private_channels{{/feature}}">

		<{{#feature flag='feature_private_channels'}}div{{else}}p{{/feature}} class="small_bottom_margin">
			<input type="hidden" id="share_model_ob_id" value="{{#if selection}}{{selection}}{{else}}{{#if model_ob.is_im}}{{model_ob.user}}{{else}}{{model_ob.id}}{{/if}}{{/if}}" />
			<label for="share_cb" class="{{#isWeb}}block{{/isWeb}} small_bottom_margin">
				<input id="share_cb" checked="checked" name="share_cb" type="checkbox" class="no_top_margin small_right_margin {{#if hide_checkbox}}hidden{{/if}}" tabindex="2"/>Share
				<span id="share_context_label">
					{{#if_equal share_context compare="im"}}with{{else}}{{#if_equal share_context compare="mpim"}}with{{else}}in{{/if_equal}}{{/if_equal}}
				</span>
			</label>

			{{#feature flag='feature_private_channels'}}
				<div id="select_share_channels" class="file_share_select inline_block no_margin"></div>
			{{else}}
				<select id="select_share_channels" tabindex="3" class="file_share_select inline_block no_margin">
					{{#if channels}}
						<optgroup label="Channels">
							{{#each channels}}
								<option value="{{this.id}}" {{#if ../selection}}
									{{#if_equal ../../selection compare=this.id}}selected="selected"{{/if_equal}}
								{{else}}
									{{#if_equal ../../model_ob.id compare=this.id}}selected="selected"{{/if_equal}}
								{{/if}}>{{#feature flag='feature_private_channels'}}{{else}}#{{/feature}}{{this.name}}</option>
							{{/each}}
						</optgroup>
					{{/if}}
					{{#if members}}
						<optgroup label="People">
							{{#each members}}
								{{#if_equal this.name compare="slackbot"}}
									<option value="{{this.id}}" {{#if ../../selection}}
										{{#if_equal ../../../selection compare=this.id}}selected="selected"{{/if_equal}}
									{{else}}
										{{#if_equal ../../../model_ob.user compare=this.id}}selected="selected"{{/if_equal}}
									{{/if}}>{{this.name}}{{#if ../../file.is_public}}{{else}} (remains private){{/if}}</option>
								{{else}}
									<option value="{{this.id}}" {{#if ../../selection}}
										{{#if_equal ../../../selection compare=this.id}}selected="selected"{{/if_equal}}
									{{else}}
										{{#if_equal ../../../model_ob.user compare=this.id}}selected="selected"{{/if_equal}}
									{{/if}}>{{#if ../../display_real_names}}{{#if this.real_name}}{{else}}@{{/if}}{{else}}@{{/if}}{{getMemberDisplayName this}}</option>
								{{/if_equal}}
							{{/each}}
						</optgroup>
					{{/if}}
					{{#if groups}}
						<optgroup label="{{privateGroupsCopy caps=true}}">
							{{#each groups}}
								<option value="{{this.id}}" {{#if ../selection}}
									{{#if_equal ../../selection compare=this.id}}selected="selected"{{/if_equal}}
								{{else}}
									{{#if_equal ../../model_ob.id compare=this.id}}selected="selected"{{/if_equal}}
								{{/if}}>{{{groupPrefix}}}{{this.name}}</option>
							{{/each}}
						</optgroup>
					{{/if}}
				</select>
			{{/feature}}

			{{#isWeb}}<br />{{/isWeb}}

			<span id="select_share_channels_note" class="modal_input_note {{#if_not_equal share_context compare="channel"}}hidden{{/if_not_equal}}">
				{{#if file.is_public}}
					Files you share into a channel are visible to all team members.
				{{else}}
					Files are private until they are shared in a public channel.
				{{/if}}
				<span id="select_share_channels_join_note" class="{{#unless show_channel_join_note}}hidden{{/unless}}"><br><b>NOTE:</b> you will join this channel when you share the file into it.</span>
			</span>

			<span id="select_share_ims_note" class="modal_input_note {{#if_not_equal share_context compare="im"}}hidden{{/if_not_equal}}">
				{{#if file.is_public}}
					&nbsp;
				{{else}}
					This file will be private; the person you're sharing with will be able to see it.
				{{/if}}
			</span>

			<span id="select_share_mpims_note" class="modal_input_note {{#if_not_equal share_context compare="mpim"}}hidden{{/if_not_equal}}">
				{{#if file.is_public}}
					&nbsp;
				{{else}}
					This file will be private; the members of the conversation you're sharing with will be able to see it.
				{{/if}}
			</span>

			<span id="select_share_groups_note" class="modal_input_note {{#if_not_equal share_context compare="group"}}hidden{{/if_not_equal}}">
				{{#if file.is_public}}
					&nbsp;
				{{else}}
					This file will be private; the members of the {{groupCopy}} you're sharing in will be able to see it.
				{{/if}}
			</span>

		</{{#feature flag='feature_private_channels'}}div{{else}}p{{/feature}}>

		{{#if is_owner}}
			{{#if_equal file.filetype compare="space"}}
				{{#if_equal file.name compare="-"}}
					{{#unless has_title}}
						{{! Untitled space — prompt for a name }}
						<p class="small_bottom_margin share_name_field">
							<label class="inline_block align_top">
								Name this Post
								<span class="input_note normal">(optional)</span>
							</label>
							<input type="text" id="file_name_input" name="name">
							<input type="hidden" name="requires_title" value="1">
						</p>
					{{/unless}}
				{{/if_equal}}
			{{/if_equal}}
		{{/if}}

		<p class="no_bottom_margin">
			<label class="{{#isClient}}inline_block{{/isClient}} align_top">
				Add Comment {{#isClient}}<br />{{/isClient}}
				<span class="input_note normal">(optional)</span>
			</label>
			<textarea id="file_comment_textarea" class="comment_input no_bottom_margin" name="comment" tabindex="4" wrap="virtual">{{comment}}</textarea>
			<span id="select_share_at_channel_blocked_note" class="modal_input_note indifferent_grey hidden"></span>
			<span id="select_share_at_channel_note" class="modal_input_note indifferent_grey hidden"></span>
		</p>
	</div>
</script>
<script id="file_public_link_template" type="text/x-handlebars-template">	{{#if show_open_public_link}}
		<a class="file_public_link file_public_link_{{file.id}}" href="{{file.permalink_public}}" target="{{file.permalink_public}}">Open public link</a>
	{{/if}}
	{{#if show_revoke_public_link}}
		<a id="file_public_link_revoker" class="delete_link" onclick="TS.ui && TS.ui.fileRevokePublicLink('{{file.id}}');" data-file-id="{{file.id}}"><i class="ts_icon ts_icon_times_circle_small"></i></a>
	{{/if}}
		
</script>
<script id="download_item_template" type="text/x-handlebars-template"><div class="download_item {{item.state}} clearfix" data-token="{{item.token}}">
	<div class="icon_actions">
		{{#if img_src}}
			<img src="{{img_src}}" width="32" height="32" class="download_icon download_img">
		{{else}}
			<i class="filetype_icon {{filetype}} s48 download_icon download_filetype"></i>
		{{/if}}

		{{#feature flag="feature_downloads_enhancements"}}
			<i class="ts_icon action_icon {{filetype}} {{#if img_src}}image{{/if}}"></i>
		{{/feature}}
	</div>

	{{#feature flag="feature_downloads_enhancements"}}
		<i class="ts_icon ts_icon_times_circle download_remove_link"></i>
	{{/feature}}

	<div class="download_data">
		<div class="download_name_row">
			<span class="download_name overflow_ellipsis">{{name}}</span>
			<a class="download_cancel_link">Cancel</a>
			{{#feature flag="feature_downloads_enhancements"}}
			{{else}}
				<a class="download_remove_link">Remove</a>
			{{/feature}}
		</div>
		<div class="download_size_row">
			<span class="download_size"><span class="partial_size">{{#if partial_size}}{{convertFilesize partial_size}} of {{/if}}</span>{{convertFilesize size}} {{pretty_type}}</span>
			<span class="download_actions">{{#feature flag="feature_downloads_enhancements"}}{{else}}- {{/feature}}
				<a class="download_show_link">{{#isMac}}Show in Finder{{else}}Open containing folder{{/isMac}}</a>
				{{#feature flag="feature_downloads_enhancements"}}
					<a class="download_open_link">Click to open</a>
				{{/feature}}
				<a class="download_retry_link">Retry</a>
			</span>
			<span class="download_estimate">{{estimate}}</span>
		</div>
		<div class="download_progress_row"><div class="download_progress_bar" style="width:{{perc}}%"></div></div>
	</div>
	<pre class="hidden download_debug"></pre>
</div></script>

<script id="file_snippet_template" type="text/x-handlebars-template"><div data-file-id="{{file.id}}" class="file_container snippet_container
	{{#if is_message}}
		{{#shouldTruncateInlineFilePreview file}}
			{{#isInlineFilePreviewTruncated msg_dom_id file}}
				inline_collapsed
			{{else}}
				inline_expanded
			{{/isInlineFilePreviewTruncated}}
		{{/shouldTruncateInlineFilePreview}}
	{{else}}
		{{#isFileContentHighlightTruncated file 25600}}truncated{{/isFileContentHighlightTruncated}}
	{{/if}}
">

	<div class="file_body snippet_body">
		{{#if file.content_highlight_html}}
			{{{truncate file.content_highlight_html 25600}}}
		{{else}}
			{{{truncate file.preview_highlight 25600}}}
		{{/if}}
	</div>

	{{#if is_message}}
		{{#if_equal file.user compare=current_user_id}}
			{{> message_file_preview_actions file=file edit=true collapse=true}}
		{{else}}
			{{> message_file_preview_actions file=file new_window=true collapse=true}}
		{{/if_equal}}
		{{> message_file_preview_footer file=file collapse=true}}
	{{/if}}

</div>{{!--/file_container--}}

{{#unless is_message}}

	{{#isFileContentHighlightTruncated file 25600}}
		<p class="file_meta inline_block"><i class="ts_icon ts_icon_inherit ts_icon_info_circle"></i> This snippet was truncated for display: <a class="file_new_window_link" href="{{file.permalink}}" target="{{file.permalink}}">see it in full</a>.</p>
	{{/isFileContentHighlightTruncated}}

	<label class="checkbox normal mini" for="snippet_wrap">
		<input type="checkbox" id="snippet_wrap" /> wrap
	</label>

{{/unless}}
</script>
<script id="file_post_template" type="text/x-handlebars-template"><div data-file-id="{{file.id}}" class="file_container post_container
	{{#if is_message}}
		{{#shouldTruncateInlineFilePreview file}}
			{{#isInlineFilePreviewTruncated msg_dom_id file}}
				inline_collapsed
			{{else}}
				inline_expanded
			{{/isInlineFilePreviewTruncated}}
		{{/shouldTruncateInlineFilePreview}}
	{{/if}}
">

	<div class="file_header post_header">
		<i class="file_header_icon post_header_icon ts_icon {{#if is_message}}ts_icon_file_text_post{{else}}ts_icon_file_text_post_small{{/if}}"></i>
		<h4 class="file_header_title post_header_title overflow_ellipsis">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</h4>
		<p class="file_header_meta post_header_meta">
			{{#if file.updated}}
				Last edited <span class="file_time_ago" data-file-id="{{file.id}}">{{toTimeAgo file.updated}}</span>
			{{else}}
				{{#if file.timestamp}}
					Added {{toCalendarDateOrNamedDayShort file.timestamp}} at {{toTime file.timestamp}}
				{{/if}}
			{{/if}}
		</p>
	</div>

	<div class="file_body post_body">{{#if file.content_html}}{{{formatSpaceHtml file.content_html}}}{{else}}{{{formatSpaceHtml file.preview}}}{{/if}}</div>

	{{#if is_message}}
		{{#if_equal file.user compare=current_user_id}}
			{{> message_file_preview_actions file=file edit=true collapse=true}}
		{{else}}
			{{> message_file_preview_actions file=file new_window=true collapse=true}}
		{{/if_equal}}
		{{> message_file_preview_footer file=file collapse=true}}
	{{/if}}

</div>{{!--/file_container--}}
</script>
<script id="file_email_template" type="text/x-handlebars-template"><div data-file-id="{{file.id}}"
	class="file_container email_container
	{{#feature flag="feature_email_like_fix_files"}}{{else}}email_reset{{/feature}}
	{{#if is_message}}
		{{#shouldTruncateInlineFilePreview file}}
			{{#isInlineFilePreviewTruncated msg_dom_id file}}
				inline_collapsed
			{{else}}
				inline_expanded
			{{/isInlineFilePreviewTruncated}}
		{{/shouldTruncateInlineFilePreview}}
	{{/if}}
">

	{{#if is_message}}
		<div class="inline_collapsed_content email_inline_collapsed_content">
			<div class="file_header email_header">
				{{#feature flag="feature_email_like_fix_files"}}<i class="file_header_icon email_header_icon ts_icon {{#if is_message}}ts_icon_file_email{{else}}ts_icon_file_email_small{{/if}}"></i>{{/feature}}

				<p class="file_header_meta email_header_meta overflow_ellipsis">
					{{#each file.from}}
						{{#if this.name}}{{this.name}}{{else}}{{this.address}}{{/if}}
					{{/each}}
				</p>

				{{#if file.title}}
					<h4 class="file_header_title email_header_title overflow_ellipsis">
						{{{formatFileTitle file}}}
						{{#if file.attachments}}<i class="ts_icon ts_icon_paperclip"></i>{{/if}}
					</h4>
				{{/if}}
			</div>
			<div class="file_body email_body{{#feature flag="feature_email_like_fix_files"}}{{else}} no_wrap overflow_ellipsis{{/feature}}">
				{{#if file.preview_plain_text}}
					{{file.preview_plain_text}}
				{{else}}
					<p class="cloud_silver small">(No Content)</p>
				{{/if}}
			</div>
		</div>
		<div class="inline_expanded_content email_inline_expanded_content">
	{{/if}}

			<div class="file_header email_header">
				{{#feature flag="feature_email_like_fix_files"}}<i class="file_header_icon email_header_icon ts_icon {{#if is_message}}ts_icon_file_email{{else}}ts_icon_file_email_small{{/if}}"></i>{{/feature}}

				{{#if file.from}}
					<p class="file_header_meta email_header_meta">
						{{#each file.from}}
							<span class="email_header_label">From</span>{{#if this.name}}{{this.name}} {{/if}}<span class="email_address">&lt;{{this.address}}></span>
						{{/each}}
					</p>
				{{/if}}

				{{#if file.to}}
					<p class="file_header_meta email_header_meta">
						{{#each file.to}}
							{{#if @first}}
								<span class="email_header_label">To</span>{{#if this.name}}{{this.name}} {{/if}}{{#if this.address}}<span class="email_address">&lt;{{this.address}}></span>{{/if}}{{#if_gt ../../to_more_count compare=0}}, {{/if_gt}}
							{{else}}
								{{#if_equal ../../to_more_count compare=1}}
									{{#if this.name}}{{this.name}} {{/if}}{{#if this.address}}<span class="email_address">&lt;{{this.address}}></span>{{/if}}
								{{else}}
									{{#if_equal @index compare=1}}
										<a class="subtle_silver" onclick="$(this).siblings('.email_more').removeClass('hidden'); $(this).addClass('hidden');">and {{../../../../to_more_count}} more</a>
									{{/if_equal}}
									<span class="email_more hidden">{{#if this.name}}{{this.name}} {{/if}}{{#if this.address}}<span class="email_address">&lt;{{this.address}}></span>{{/if}}{{#if @last}}{{else}},{{/if}}</span>
								{{/if_equal}}
							{{/if}}
						{{/each}}
					</p>
				{{/if}}

				{{#if file.cc}}
					<p class="file_header_meta email_header_meta">
						{{#each file.cc}}
							{{#if @first}}
								<span class="email_header_label">CC</span>{{#if this.name}}{{this.name}} {{/if}}<span class="email_address">&lt;{{this.address}}></span>{{#if_gt ../../cc_more_count compare=0}}, {{/if_gt}}
							{{else}}
								{{#if_equal ../../cc_more_count compare=1}}
									{{#if this.name}}{{this.name}} {{/if}}<span class="email_address">&lt;{{this.address}}></span>
								{{else}}
									{{#if_equal @index compare=1}}
										<a class="subtle_silver" onclick="$(this).siblings('.email_more').removeClass('hidden'); $(this).addClass('hidden');">and {{../../../../cc_more_count}} more</a>
									{{/if_equal}}
									<span class="email_more hidden">{{#if this.name}}{{this.name}} {{/if}}<span class="email_address">&lt;{{this.address}}></span>{{#if @last}}{{else}},{{/if}}</span>
								{{/if_equal}}
							{{/if}}
						{{/each}}
					</p>
				{{/if}}

				<h4 class="file_header_title email_header_title"><span class="email_header_label">Subject</span><strong>{{#if file.subject}}{{file.subject}}{{else}}(No Subject){{/if}}</strong></h4>

				{{#if file.timestamp}}
					<p class="file_header_meta email_header_meta"><span class="email_header_label">Date</span>{{toCalendarDateOrNamedDayShort file.timestamp}} at {{toTime file.timestamp}}</p>
				{{/if}}

			</div>
			<div class="file_body email_body">

				<div class="email_content">
					<div class="loading_hash_animation large_top_margin large_bottom_margin"><img src="/img/loading_hash_animation_@2x.gif" alt="Loading" /><br />loading ...</div>
					{{#if_not_equal file.simplified_html compare=""}}
						{{{proxyImgUrls file.simplified_html}}}
					{{else}}
						(No Content)
					{{/if_not_equal}}
				</div>

				{{#if file.attachments}}
					<div class="file_attachments">{{pluralCount file.attachments.length 'attachment' 'attachments'}}</div>
				{{/if}}

				{{#if file.attachments}}
					<div class="email_attachments">
						{{#each file.attachments}}
							{{#mimeTypeIsImage type=this.mimetype}}
								<a href="{{this.url}}" class="lightbox_external_link" data-src="{{this.url}}" data-link-url="{{this.url}}" target="_blank">
									<img src="{{this.url}}" class="attachment image">
								</a>
							{{else}}
								<div class="attachment">
									{{!-- <a class="add_to_slack_btn btn btn_small btn_outline float_right">Add to Slack</a> --}}
									<i class="ts_icon ts_icon_paperclip align_top"></i>
									<a href="{{this.url}}" target="{{this.filename}}" class="attachment_filename align_top"><span class="align_top">{{this.filename}}</span> <i class="ts_icon ts_icon_external_link"></i></a>
									<span class="attachment_filesize align_text_bottom">{{convertFilesize this.size}} {{this.mimetype}}</span>
								</div>
							{{/mimeTypeIsImage}}
						{{/each}}
					</div>
				{{/if}}
			</div>

	{{#if is_message}}
		</div>{{!--/email_inline_expanded_content--}}
		{{> message_file_preview_actions collapse=true file=file open_original=true new_window=true}}
		{{> message_file_preview_footer file=file collapse=true}}
	{{/if}}

</div>
</script>
<script id="file_image_template" type="text/x-handlebars-template"><div class="file_container image_container" style="width: {{image_width}}px;">

	<a data-file-id="{{file.id}}"
		data-src="{{image_src}}"
		href="{{file.url_private}}"
		target="{{file.url_private}}"
		style="width: {{image_width}}px;"
		class="file_body image_body image_{{file.filetype}}
			{{#if lightbox}}{{#if file.is_external}}lightbox_external_link{{else}}lightbox_channel_link lightbox_link{{/if}}{{/if}}"
		{{#if lightbox}}data-link-url="{{file.url_private}}"{{/if}}
		{{#unless file.is_external}}
			title="{{~#if lightbox~}}
				Open in lightbox ({{#isMac}}cmd{{else}}ctrl{{/isMac}}+click to open original in new tab)
			{{~else~}}
				{{#isMac}}cmd{{else}}ctrl{{/isMac}}+click to open original in new tab
			{{~/if~}}"
		{{/unless}}>

		<div class="image_preserve_aspect_ratio">
			<figure class="image_bg" 
				{{#if image_lazyload}}
					data-real-background-image="{{image_src}}" style="
				{{else}}
					style="background-image:url('{{image_src}}');
				{{/if}}
				{{#if preserve_aspect_ratio}}
					padding-top: -webkit-calc( {{file.thumb_360_h}} / {{file.thumb_360_w}} * 100%); padding-top: -moz-calc( {{file.thumb_360_h}} / {{file.thumb_360_w}} * 100%); padding-top: calc( {{file.thumb_360_h}} / {{file.thumb_360_w}} * 100%);
				{{else}}
					width: {{file.thumb_360_w}}px; height: {{file.thumb_360_h}}px;
				{{/if}}">

				<img class="image_hide"
					{{#if image_lazyload}}
						data-real-src="{{image_src}}"
					{{else}}
						src="{{image_src}}"
					{{/if}}
				/>

			</figure>
		</div>

	</a>

	{{#if is_message}}
		{{#if_equal file.mode compare='hosted'}}
			{{#fileDefaultIsNewWindow id=file.id}}
				{{! the default for images and pdfs is to open the original in a browser window }}
				{{> message_file_preview_actions file=file download=true main_action="new_window"}}
			{{else}}
				{{! the default for other files is to download }}
				{{> message_file_preview_actions file=file download=true main_action="download"}}
			{{/fileDefaultIsNewWindow}}
		{{else}}
			{{> message_file_preview_actions file=file main_action="new_window"}}
		{{/if_equal}}
	{{/if}}

</div>{{!--/file_container--}}
</script>
<script id="file_generic_template" type="text/x-handlebars-template"><div class="file_container generic_container">

	<a data-file-id="{{file.id}}"
		target="{{#isClient}}{{newWindowName}}{{else}}_blank{{/isClient}}"
		class="file_header generic_header {{#if_equal file.mode compare='hosted'}}{{#fileDefaultIsNewWindow id=file.id}}{{else}}file_ssb_download_link{{/fileDefaultIsNewWindow}}{{/if_equal}}"

		{{#if_equal file.mode compare='hosted'}}
			{{#fileDefaultIsNewWindow id=file.id}}
				href="{{file.url_private}}"
			{{else}}
				href="{{file.url_private_download}}"
			{{/fileDefaultIsNewWindow}}
		{{else}}
			href="{{fileUrl file}}"
		{{/if_equal}}
	>

		<i class="file_header_icon generic_header_icon filetype_icon {{file.filetype}} s48">
			{{#fileIconTypeDownload file}}
				<i class="ts_icon ts_icon_arrow_down {{file.filetype}}"></i>
			{{else}}
				<i class="ts_icon ts_icon_arrow_ne_medium {{file.filetype}}"></i>
			{{/fileIconTypeDownload}}
		</i>

		<h4 class="file_header_title generic_header_title overflow_ellipsis">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</h4>

		<p class="file_header_meta generic_header_meta">
			{{#if filesize}}
				<span class="meta_size">{{convertFilesize file.size}}</span><span class="meta_hover_placement">
				<span class="meta_type overflow_ellipsis">{{#if file.is_external}}{{{makeExternalFiletypeHTML file}}}{{else}}{{file.pretty_type}}{{/if}}</span>
			{{else}}
				<span class="meta_hover_placement"><span class="meta_type overflow_ellipsis">{{#if file.is_external}}{{{makeExternalFiletypeHTML file}}}{{else}}{{file.pretty_type}}{{/if}}</span>
			{{/if}}

			<span class="meta_hover overflow_ellipsis">
				{{#if_equal file.mode compare='hosted'}}
					{{#fileDefaultIsNewWindow id=file.id}}
						Click to open original
					{{else}}
						Click to download
					{{/fileDefaultIsNewWindow}}
				{{else}}
					Click to open in
						{{#if_equal file.external_type compare="gdrive"}}Google Drive{{/if_equal}}
						{{#if_equal file.external_type compare="dropbox"}}Dropbox{{/if_equal}}
						{{#if_equal file.external_type compare="box"}}Box{{/if_equal}}
						{{#if_equal file.external_type compare="onedrive"}}OneDrive{{/if_equal}}
						{{#if_equal file.external_type compare="unknown"}}a web page{{/if_equal}}
				{{/if_equal}}
			</span></span>
		</p>

	</a>

	{{#if is_message}}
		{{#if_equal file.mode compare='hosted'}}
			{{#fileDefaultIsNewWindow id=file.id}}
				{{! the default for images and pdfs is to open the original in a browser window }}
				{{> message_file_preview_actions file=file download=true main_action="new_window"}}
			{{else}}
				{{! the default for other files is to download }}
				{{> message_file_preview_actions file=file download=true main_action="download"}}
			{{/fileDefaultIsNewWindow}}
		{{else}}
			{{> message_file_preview_actions file=file main_action="new_window"}}
		{{/if_equal}}
	{{/if}}

</div>{{!--/file_container--}}
</script>

<script id="comments_template" type="text/x-handlebars-template">	<div id="{{#if file}}{{makeFileCommentsDomId file}}{{/if}}" class="comments">
		{{{comments file}}}
	</div>
</script>
<script id="comment_template" type="text/x-handlebars-template">	<div id="{{comment.id}}" class="comment" data-timestamp="{{comment.timestamp}}">
		<a name="{{comment.id}}"></a>
		<span class="no_print">{{{makeMemberPreviewLinkImage comment.user 36}}}</span>
		<p class="comment_meta">
			<span class="no_print">{{{makeMemberPreviewLinkById comment.user}}}</span>
			<span class="print_only_inline"><strong>{{getMemberDisplayNameById comment.user}}</strong> • </span>
			{{toCalendarDateOrNamedDayShort comment.timestamp}} at {{toTime comment.timestamp}}
			{{#unless hide_star}}{{#if file}}<span class="no_print">{{{star 'file_comment' comment file}}}</span>{{/if}}{{/unless}}
			{{#if show_comment_actions}}
				<a class="comment_actions" {{#if file}}data-file-id="{{file.id}}"{{/if}} data-comment-id="{{comment.id}}"><i class="comment_cog ts_icon ts_icon_cog ts_icon_inherit"></i></a>
			{{/if}}
		</p>				
		<div class="comment_body">{{{formatMessage comment.comment}}}</div>
		{{{rxnPanel comment._rxn_key rxn_options}}}
	</div>
</script>
<script id="comment_standalone_template" type="text/x-handlebars-template">	<span class="subtle_silver">
		{{#if_equal comment.user compare=current_user_id}}
			Your
		{{else}}
			<span class="{{getMemberColorClassById comment.user}}">{{{makeMemberPreviewLinkById comment.user}}}</span>'s
		{{/if_equal}}
		comment on
		{{#if_equal file.user compare=current_user_id}}
			your
		{{else}}
			{{#feature flag="feature_email_integration"}}
				<span class="{{getMemberColorClassById file.user}}">{{{makeMemberPreviewLink entity false}}}</span>'s 
			{{else}}
				<span class="{{getMemberColorClassById file.user}}">{{{makeMemberPreviewLinkById file.user}}}</span>'s 
			{{/feature}}
		{{/if_equal}}
		{{#if_equal file.mode compare="snippet"}}
			snippet:
		{{/if_equal}}
		{{#if_equal file.mode compare="post"}}
			post:
		{{/if_equal}}
		{{#if_equal file.mode compare="space"}}
			space:
		{{/if_equal}}
		{{#if_equal file.mode compare="hosted"}}
			file:
		{{/if_equal}}
		{{#if_equal file.mode compare="external"}}
			file:
		{{/if_equal}}
	</span>
	<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link bold">{{{formatFileTitle file}}}</a><br />
	
	<i class="icon_quote float_left ts_icon ts_icon_quote"></i>
	
	<p class="comment small_bottom_margin">{{{formatMessage comment.comment}}}</p>

</script>

<script id="messages_subtypes_bot_add_template" type="text/x-handlebars-template">Added {{addIndefiniteArticle service_type}} integration named "<a href="/services/{{bot_id}}">{{getBotName this}}</a>" in this channel.
</script>
<script id="messages_subtypes_bot_disable_template" type="text/x-handlebars-template">Disabled {{addIndefiniteArticle service_type}} integration named "<a href="/services/{{bot_id}}">{{getBotName this}}</a>" in this channel. You can <a href="/services/{{bot_id}}">re-enable this integration</a> or <a href="/services/new">create a new one</a>.
</script>
<script id="messages_subtypes_bot_enable_template" type="text/x-handlebars-template">Enabled {{addIndefiniteArticle service_type}} integration named "<a href='/services/{{bot_id}}'>{{getBotName this}}</a>" in this channel.
</script>
<script id="messages_subtypes_bot_remove_template" type="text/x-handlebars-template">Removed {{addIndefiniteArticle service_type}} integration named "<a href='/services/{{bot_id}}'>{{getBotName this}}</a>" in this channel.
</script>

<script id="messages_day_divider_template" type="text/x-handlebars-template"><div class="day_divider" id="{{makeDayDividerDomId ts}}" data-date="{{toCalendarDate ts}}" data-ts="{{ts}}"><hr role="separator" aria-hidden="true" /><i class="copy_only"><br>----- </i><div class="day_divider_label" aria-label="{{toCalendarDateOrNamedDayWords ts}}">{{toCalendarDateOrNamedDay ts}}</div><i class="copy_only"> {{toCalendarDateIfYesterdayOrToday ts}} -----</i></div></script>
<script id="message_file_comment_template" type="text/x-handlebars-template">{{! DEPRECATED_FILE_NOTICE: This file is replaced by message.hbs with the release of feature_new_message_markup. }}

	<div id="{{makeMsgDomId msg.ts}}" class="{{#if msg.no_display}}hidden{{/if}} message file_reference file_comment {{#if first_in_block}}first{{/if}} {{#if unread}}unread{{/if}} {{#if highlight}}highlight{{/if}} {{#if show_divider}}divider{{/if}} show_user {{#showAvatars}}avatar{{/showAvatars}} {{#if is_file_convo_continuation}}comment_continuation{{/if}}" data-ts="{{msg.ts}}">

		{{#unless unprocessed}}
			{{#unless standalone}}
				{{#if show_actions_cog}}
					{{{msgActions msg}}}
				{{/if}}
			{{/unless}}
		{{/unless}}

		{{#showAvatars}}
			{{#if is_file_convo_continuation}}
			{{else}}
				{{{makeMemberPreviewLinkImage member.id 36}}}
			{{/if}}
		{{/showAvatars}}

		{{#isTheme theme='dense'}}

			<span class="message_star_holder">{{{star 'file_comment' comment file}}}</span>

			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}
			<div class="file_details">

				{{#if is_file_convo_continuation}}
				{{else}}
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link icon icon_40 {{icon_class}}">
						{{#if file.thumb_80}}
							{{#if_equal icon_class compare="thumb_40"}}					
								<img src="{{file.thumb_80}}" />
							{{else}}
								<img src="{{file.thumb_360}}" />
							{{/if_equal}}						
						{{else}}
							<span data-file-id="{{file.id}}" class="filetype_icon s24 {{file.filetype}}"></span>
						{{/if}}
						<i class="ts_icon ts_icon_comment icon_comment"></i>
					</a>
				{{/if}}
				<em>
					{{#if is_file_convo_continuation}}
						{{{makeMemberPreviewLink member}}} commented:
					{{else}}
						{{{makeMemberPreviewLink member}}} commented on
						{{#if uploader}}
							{{{makeMemberPreviewLink uploader}}}{{possessive uploader.name}} {{#if_equal file.mode compare="snippet"}}snippet{{else}}file{{/if_equal}}
						{{/if}}
						<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_name">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</a>
						<a href="{{#if file.is_external}}{{fileUrl file}}{{else}}{{file.permalink}}{{/if}}" target="{{file.permalink}}" data-file-id="{{file.id}}" class="file_new_window_link ts_icon ts_icon_external_link ts_icon_inherit icon_new_window" title="{{#if file.is_external}}Open original in new tab{{else}}Open file page{{/if}}"></a>
					{{/if}}
				</em>
				<div class="comment no_bottom_margin">{{{formatMessage comment.comment}}}</div>
				{{{rxnPanel comment._rxn_key rxn_options}}}
			</div>
		{{/isTheme}}

		{{#isTheme theme='light'}}

			<a href="/team/{{member.name}}" {{#isClient}}target="/team/{{member.name}}"{{/isClient}} class="member {{getMemberColorClassById member.id}} message_sender" data-member-id="{{member.id}}">{{getMemberDisplayName member}}</a>
			
			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}
			
			<span class="message_star_holder">{{{star 'file_comment' comment file}}}</span>
			
			{{#if starred_items_actions}}
				<div class="actions">
					{{{jump_link}}}
					<button class="file_star btn_icon btn btn_outline ts_tip_btn ts_tip ts_tip_top">
						{{{star 'message' msg model_ob}}}
						<div class="star_message ts_tip_tip">Star</div>
						<div class="unstar_message ts_tip_tip">Unstar</div>
					</button>
				</div>
			{{else}}
				{{#if jump_link}}{{{jump_link}}}{{/if}}
			{{/if}}
			
			<br />
				
			{{#if is_file_convo_continuation}}
			{{else}}
				<span class="meta meta_feature_fix_files">
					Commented on
					{{#if uploader}}
						{{{makeMemberPreviewLinkById uploader.id false}}}{{possessive uploader.name}} {{#if_equal file.mode compare="snippet"}}snippet{{else}}file{{/if_equal}}
					{{/if}}
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_force_flexpane file_name">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</a>
					{{#if file.is_external}}
						<a {{{makeRefererSafeFileLink file}}} target="{{newWindowName}}" data-toggle="tooltip" title="Open file in a new tab" aria-label="Open file in a new tab">
					{{else}}
						<a href="{{file.permalink}}" target="{{newWindowName}}" data-toggle="tooltip" title="Open file in a new tab" aria-label="Open file in a new tab" data-file-id="{{file.id}}" class="file_new_window_link">
					{{/if}}
					<i class="ts_icon ts_icon_external_link file_inline_icon"></i></a>
				</span>
				<br />
			{{/if}}
			
			{{#if show_comment_quote_icon}}
				<i class="icon_quote float_left ts_icon ts_icon_quote"></i>
			{{/if}}

			<div class="comment">{{{formatMessage comment.comment}}}</div>
			{{{rxnPanel comment._rxn_key rxn_options}}}
			
		{{/isTheme}}		

	</div>
</script>
<script id="message_file_post_comment_template" type="text/x-handlebars-template">{{! DEPRECATED_FILE_NOTICE: This file is replaced by message.hbs with the release of feature_new_message_markup. }}
	<div id="{{makeMsgDomId msg.ts}}" class="{{#if msg.no_display}}hidden{{/if}} message file_reference file_post_comment {{#if first_in_block}}first{{/if}} {{#if unread}}unread{{/if}} {{#if highlight}}highlight{{/if}} {{#if show_divider}}divider{{/if}} show_user {{#showAvatars}}avatar{{/showAvatars}} {{#if is_file_convo_continuation}}comment_continuation{{/if}}" data-ts="{{msg.ts}}">

		{{#unless unprocessed}}
			{{#unless standalone}}
				{{#if show_actions_cog}}
					{{{msgActions msg}}}
				{{/if}}
			{{/unless}}
		{{/unless}}
		
		{{#showAvatars}}
			{{#if is_file_convo_continuation}}
			{{else}}
				{{{makeMemberPreviewLinkImage member.id 36}}}
			{{/if}}
		{{/showAvatars}}

		{{#isTheme theme='dense'}}
			<span class="message_star_holder">{{{star 'file_comment' comment file}}}</span>
			
			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}
			<em>
			{{#if is_file_convo_continuation}}
					{{{makeMemberPreviewLink member}}} commented:
			{{else}}
				{{{makeMemberPreviewLink member}}} commented on
				{{#if uploader}}
					{{{makeMemberPreviewLink uploader}}}'s post
				{{/if}}
				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_name">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</a>
				<a href="{{file.permalink}}" target="{{file.permalink}}" class="ts_icon ts_icon_external_link icon_new_window" title="Open file page"></a>
			{{/if}}
			</em>
			<div class="no_bottom_margin">{{{formatMessage comment.comment}}}</div>
			{{{rxnPanel comment._rxn_key rxn_options}}}
		{{/isTheme}}

		{{#isTheme theme='light'}}

			<a href="/team/{{member.name}}" {{#isClient}}target="/team/{{member.name}}"{{/isClient}} class="member {{getMemberColorClassById member.id}} message_sender" data-member-id="{{member.id}}">{{getMemberDisplayName member}}</a>
			
			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}
			
			<span class="message_star_holder">{{{star 'file_comment' comment file}}}</span><br />
			
			{{#if jump_link}}{{{jump_link}}}{{/if}}
				
			{{#if is_file_convo_continuation}}
			{{else}}
				<span class="meta meta_feature_fix_files">
					Commented on
					{{#if uploader}}
						{{{makeMemberPreviewLinkById uploader.id false}}}'s post
					{{/if}}
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_force_flexpane file_name">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</a>
					<a href="{{file.permalink}}" target="{{newWindowName}}" data-toggle="tooltip" title="Open post in a new tab" aria-label="Open post in a new tab"><i class="ts_icon ts_icon_external_link file_inline_icon"></i></a>
				</span><br />
			{{/if}}
			
			{{#if show_comment_quote_icon}}
				<i class="icon_quote float_left ts_icon ts_icon_quote"></i>
			{{/if}}

			<div class="comment no_bottom_margin">{{{formatMessage comment.comment}}}</div>
			{{{rxnPanel comment._rxn_key rxn_options}}}

		{{/isTheme}}		
						
	</div>
</script>
<script id="message_file_template" type="text/x-handlebars-template">{{! DEPRECATED_FILE_NOTICE: This file is replaced by message.hbs with the release of feature_new_message_markup. }}
<div id="{{makeMsgDomId msg.ts}}" class="{{#if msg.no_display}}hidden{{/if}} feature_fix_files message file_reference {{#if is_mention}}file_mention{{else}}file_share{{/if}} {{#if first_in_block}}first{{/if}} {{#if unread}}unread{{/if}} {{#if highlight}}highlight{{/if}} {{#if show_divider}}divider{{/if}} show_user {{#showAvatars}}avatar{{/showAvatars}}" data-ts="{{msg.ts}}">

	{{#unless unprocessed}}
		{{#unless standalone}}
			{{#if show_actions_cog}}
				{{{msgActions msg}}}
			{{/if}}
		{{/unless}}
	{{/unless}}

	{{#showAvatars}}
		{{makeProfileImage member size="36"}}
	{{/showAvatars}}

	{{#isTheme theme='dense'}}
		<span class="message_star_holder">{{{star 'file' file null}}}</span>
		
		{{#if permalink}}
			<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
		{{else}}
			<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
		{{/if}}

		<em {{#unless standalone}}data-file-id="{{file.id}}" class="dense_meta msg_inline_file_preview_toggler {{#isInlineFilePreviewExpanded container_id=msg_dom_id file_id=file.id}}expanded{{else}}collapsed{{/isInlineFilePreviewExpanded}}"{{/unless}}>
			{{{makeMemberPreviewLink member}}}
			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}">
				{{share_verb}}
				{{#if uploader}}
					</a>
					{{{makeMemberPreviewLinkById uploader.id false}}}
					{{~possessiveForMember uploader~}}
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}">
				{{else}}
					{{share_determiner}}
				{{/if}}
				{{share_noun}}:
				<span class="file_preview_link file_force_flexpane bold msg_inline_file_preview_title">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</span>

				{{#unless standalone}}
					<i class="ts_icon ts_icon_caret_down"></i>
					<i class="ts_icon ts_icon_caret_right"></i>
				{{/unless}}
			</a>
		</em>

	{{/isTheme}}{{!--/dense--}}

	{{#isTheme theme='light'}}
		{{{makeMemberPreviewLink member}}}

		{{#if permalink}}
			<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
		{{else}}
			<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
		{{/if}}
		
		<span class="message_star_holder">{{{star 'file' file null}}}</span>

		<br />

		{{#if starred_items_actions}}
			<div class="actions">
				{{{jump_link}}}
				<button class="file_star btn_icon btn btn_outline ts_tip_btn ts_tip ts_tip_top">
					{{{star 'message' msg model_ob}}}
					<div class="star_message ts_tip_tip">Star</div>
					<div class="unstar_message ts_tip_tip">Unstar</div>
				</button>
			</div>
		{{else}}
			{{#if jump_link}}{{{jump_link}}}{{/if}}
		{{/if}}

		<span data-file-id="{{file.id}}" class="meta{{#unless standalone}} msg_inline_file_preview_toggler {{#isInlineFilePreviewExpanded container_id=msg_dom_id file_id=file.id}}expanded{{else}}collapsed{{/isInlineFilePreviewExpanded}}{{/unless}}">
			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}">
				{{#if_equal file.external_type compare="gdrive"}}<i class="ts_icon ts_icon_google_drive"></i>{{/if_equal}}
				{{#if_equal file.external_type compare="dropbox"}}<i class="ts_icon ts_icon_dropbox"></i>{{/if_equal}}
				{{#if_equal file.external_type compare="box"}}<i class="ts_icon ts_icon_box_square"></i>{{/if_equal}}

				{{share_verb}}

				{{#if uploader}}
					</a>
					{{{makeMemberPreviewLinkById uploader.id false}}}
					{{~possessiveForMember uploader~}}
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}">
				{{else}}
					{{share_determiner}}
				{{/if}}

				{{share_noun}}{{#if title_hider}}<span class="msg_inline_file_title_hider">:{{else}}:{{/if}}
					<span class="file_preview_link file_force_flexpane bold msg_inline_file_preview_title">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</span>
				{{#if title_hider}}</span>{{/if}}

				{{#unless standalone}}
					<i class="ts_icon ts_icon_caret_down"></i>
					<i class="ts_icon ts_icon_caret_right"></i>
				{{/unless}}
			</a>
		</span>

	{{/isTheme}}{{!--/light--}}

	{{#unless standalone}}
	
		{{#if file_partial}}
			{{> (concatStr 'file_' file_partial)}} {{!-- dynamically create the string "file_snippet" from "file_" and the template arg file_partial (snippet) --}}
		{{/if}}

		{{{rxnPanel file._rxn_key rxn_options}}}

		{{#if show_initial_comment}}
			{{#if file.initial_comment}}
				{{#isTheme theme='light'}}
					<div class="initial_comment">
						<i class="icon_quote float_left ts_icon ts_icon_quote"></i>
						<div class="comment no_bottom_margin">
							{{{formatMessage file.initial_comment.comment}}}
						</div>
						{{{rxnPanel file.initial_comment._rxn_key rxn_options}}}
					</div>
				{{/isTheme}}

				{{#isTheme theme='dense'}}
					<p class="small_top_margin no_bottom_margin">{{{formatMessage file.initial_comment.comment}}}</p>
					{{{rxnPanel file.initial_comment._rxn_key rxn_options}}}
				{{/isTheme}}
			{{/if}}
		{{/if}}

	{{/unless}}{{!--/standalone--}}

</div>
</script>

<script id="message_file_share_old_template" type="text/x-handlebars-template">
	{{! DEPRECATED_FILE_NOTICE: This file is replaced by file.hbs with the release of feature_fix_files. }}
	<div id="{{makeMsgDomId msg.ts}}" class="{{#if msg.no_display}}hidden{{/if}} message file_reference {{#if is_mention}}file_mention{{else}}file_share{{/if}} {{#if first_in_block}}first{{/if}} {{#if unread}}unread{{/if}} {{#if highlight}}highlight{{/if}} {{#if show_divider}}divider{{/if}} show_user {{#showAvatars}}avatar{{/showAvatars}}" data-ts="{{msg.ts}}">

		{{#unless unprocessed}}
			{{#unless standalone}}
				{{#if show_actions_cog}}
					{{{msgActions msg}}}
				{{/if}}
			{{/unless}}
		{{/unless}}

		{{#showAvatars}}
			{{{makeMemberPreviewLinkImage member.id 36}}}
		{{/showAvatars}}

		{{#isTheme theme='dense'}}

			<span class="message_star_holder">{{{star 'file' file null}}}</span>

			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}
			<em>
				{{{makeMemberPreviewLink member}}} {{#if is_mention}}mentioned{{else}}shared{{/if}}:
				{{#if uploader}}
					{{{makeMemberPreviewLink uploader}}}{{possessive uploader.name}} file:
				{{/if}}
			</em>
			<a href="{{#if file.is_external}}{{fileUrl file}}{{else}}{{file.permalink}}{{/if}}" target="{{#if file.is_external}}{{fileUrl file}}{{else}}{{file.permalink}}{{/if}}" class="ts_icon ts_icon_external_link ts_icon_inherit icon_new_window" title="{{#if file.is_external}}Open original in new tab{{else}}Open file page{{/if}}"></a>
			<div class="file_details">
				{{#if file.is_external}}
					<a href="{{fileUrl file}}" {{#isClient}}target="{{fileUrl file}}"{{/isClient}} data-file-id="{{file.id}}" class="icon icon_40 {{icon_class}}" title="Open original in new tab">
				{{else}}
					{{#fileIsImage id=file.id}}
						<a href="{{file.url_private}}" {{#isClient}}target="{{file.url_private}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link icon icon_40 {{icon_class}} {{#if lightbox}}lightbox_link{{/if}}" title="Open in lightbox ({{#isMac}}cmd{{else}}ctrl{{/isMac}}+click to open original in new tab)">
					{{else}}
						<a href="{{file.url_private}}" {{#isClient}}target="{{file.url_private}}"{{/isClient}} data-file-id="{{file.id}}" class="icon icon_40 {{icon_class}}" title="Open original in new tab">
					{{/fileIsImage}}
				{{/if}}
					{{#if file.thumb_80}}
						{{#if_equal icon_class compare="thumb_40"}}					
							<img src="{{file.thumb_80}}" />
						{{else}}
							<img src="{{file.thumb_360}}" />
						{{/if_equal}}						
					{{else}}
						<span data-file-id="{{file.id}}" class="filetype_icon s24 {{file.filetype}}"></span>
					{{/if}}
				</a>
				<span class="float_left" style="width: 85%">				
					<a href="{{file.permalink}}"{{#isClient}}target="{{file.permalink}}"{{/isClient}}  data-file-id="{{file.id}}" class="file_preview_link file_name">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</a>
					{{#unless file.thumb_360}}
						{{#unless file.is_external}}
							<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" target="{{newWindowName}}" data-toggle="tooltip" title="Download file" data-file-id="{{file.id}}" class="file_ssb_download_link"><i class="ts_icon ts_icon_cloud_download file_inline_icon"></i></a>
						{{/unless}}
					{{/unless}}				
					{{#unless standalone}}
						{{#if show_retina_thumb}}
							{{#if file.thumb_360_gif}}
								{{{inlineImgToggler file.thumb_360_gif msg_dom_id}}}
							{{else}}
								{{{inlineImgToggler file.thumb_720 msg_dom_id}}}
							{{/if}}
						{{else}}
							{{#if file.thumb_360_gif}}
								{{{inlineImgToggler file.thumb_360_gif msg_dom_id}}}
							{{else}}
								{{{inlineImgToggler file.thumb_360 msg_dom_id}}}
							{{/if}}
						{{/if}}
					{{/unless}}
					<br />
					<span class="file_share_shared_label{{#unless file.is_shared}} hidden{{/unless}}" data-file-id="{{file.id}}">
						<span class="bullet">•</span> {{{makeFileShareLabel file}}}
					</span>

					<span class="bullet">•</span>
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">
						{{#if file.comments_count}}{{pluralCount file.comments_count 'comment' 'comments'}}{{else}}Add comment{{/if}}
					</a>
					
					{{#fileIsImage id=file.id}}
						<span class="bullet">•</span>
						<a href="{{file.url_private}}" target="{{file.url_private}}" data-file-id="{{file.id}}">Open original</a>
					{{/fileIsImage}}
					
				</span>
				<div class="clear_both"></div>
			</div>

			{{#unless standalone}}
				{{#if show_retina_thumb}}
					{{#if file.thumb_360_gif}}
						{{{inlineImgDiv file.thumb_360_gif msg_dom_id}}}
					{{else}}
						{{{inlineImgDiv file.thumb_720 msg_dom_id}}}
					{{/if}}
				{{else}}
					{{#if file.thumb_360_gif}}
						{{{inlineImgDiv file.thumb_360_gif msg_dom_id}}}
					{{else}}
						{{{inlineImgDiv file.thumb_360 msg_dom_id}}}
					{{/if}}
				{{/if}}
				
				{{{rxnPanel file._rxn_key rxn_options}}}

				{{#if show_initial_comment}}
				{{#if file.initial_comment}}
					<p class="small_top_margin no_bottom_margin">{{{formatMessage file.initial_comment.comment}}}</p>
					{{{rxnPanel file.initial_comment._rxn_key rxn_options}}}
				{{/if}}
				{{/if}}
			{{/unless}}

		{{/isTheme}}

		{{#isTheme theme='light'}}

			<a href="/team/{{member.name}}" {{#isClient}}target="/team/{{member.name}}"{{/isClient}} class="member {{getMemberColorClassById member.id}} message_sender" data-member-id="{{member.id}}">{{getMemberDisplayName member}}</a>
			
			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}
			
			<span class="message_star_holder">{{{star 'file' file null}}}</span>
			
			<br />
			
			{{#if jump_link}}{{{jump_link}}}{{/if}}
				
			<span class="meta">
				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="{{#if_not_equal file.filetype compare='space'}}file_preview_link{{/if_not_equal}} file_name">
					{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}
				</a>
				{{#if file.is_external}}
					<a href="{{#if file.is_external}}{{fileUrl file}}{{else}}{{file.permalink}}{{/if}}" target="{{newWindowName}}" data-toggle="tooltip" title="Open file on {{#if_equal file.external_type compare="gdrive"}}Google Drive{{/if_equal}}{{#if_equal file.external_type compare="dropbox"}}Dropbox{{/if_equal}}{{#if_equal file.external_type compare="box"}}Box{{/if_equal}}{{#if_equal file.external_type compare="onedrive"}}OneDrive{{/if_equal}}{{#if_equal file.external_type compare="unknown"}}a web page{{/if_equal}}"><i class="ts_icon ts_icon_external_link file_inline_icon"></i></a>
				{{/if}}
				{{#unless file.thumb_360}}
					{{#unless file.is_external}}
						<a href="{{file.url_private_download}}" target="{{newWindowName}}" data-toggle="tooltip" title="Download file" aria-label="Download file" data-file-id="{{file.id}}" class="file_ssb_download_link"><i class="ts_icon ts_icon_cloud_download file_inline_icon"></i></a>
					{{/unless}}
				{{/unless}}				
			</span>
			
			{{#unless standalone}}
				{{#if show_retina_thumb}}
					{{#if file.thumb_360_gif}}
						{{{inlineImgToggler file.thumb_360_gif msg_dom_id}}}
					{{else}}
						{{{inlineImgToggler file.thumb_720 msg_dom_id}}}
					{{/if}}
				{{else}}
					{{#if file.thumb_360_gif}}
						{{{inlineImgToggler file.thumb_360_gif msg_dom_id}}}
					{{else}}
						{{{inlineImgToggler file.thumb_360 msg_dom_id}}}
					{{/if}}
				{{/if}}

				{{#if show_retina_thumb}}
					{{#if file.thumb_360_gif}}
						{{{inlineImgDiv file.thumb_360_gif msg_dom_id}}}
					{{else}}
						{{{inlineImgDiv file.thumb_720 msg_dom_id}}}
					{{/if}}
				{{else}}
					{{#if file.thumb_360_gif}}
						{{{inlineImgDiv file.thumb_360_gif msg_dom_id}}}
					{{else}}
						{{{inlineImgDiv file.thumb_360 msg_dom_id}}}
					{{/if}}
				{{/if}}
					
				{{{rxnPanel file._rxn_key rxn_options}}}
			{{/unless}}

			<span class="meta block">
				{{#if file.is_external}}
					{{#if_equal file.external_type compare="gdrive"}}
						<a href="{{fileUrl file}}" class="no_underline" target="{{newWindowName}}" data-toggle="tooltip" title="Open file on Google Drive"><img src="https://slack.global.ssl.fastly.net/66f9/img/services/gdrive_32.png" class="gdrive_icon file_service_icon grayscale" /></a>
					{{/if_equal}}
					{{#if_equal file.external_type compare="dropbox"}}
						<a href="{{fileUrl file}}" class="no_underline" target="{{newWindowName}}" data-toggle="tooltip" title="Open file on Dropbox"><i class="ts_icon ts_icon_dropbox ts_icon_inherit file_service_icon"></i></a>
					{{/if_equal}}
					{{#if_equal file.external_type compare="box"}}
						<a href="{{fileUrl file}}" class="no_underline" target="{{newWindowName}}" data-toggle="tooltip" title="Open file on Box"><img src="https://slack.global.ssl.fastly.net/9a0a/plugins/auth/box/assets/auth_32.png" class="box_icon file_service_icon grayscale" /></a>
					{{/if_equal}}
					{{#if_equal file.external_type compare="onedrive"}}
						<a href="{{fileUrl file}}" class="no_underline" target="{{newWindowName}}" data-toggle="tooltip" title="Open file on OneDrive"><img src="https://slack.global.ssl.fastly.net/da92/plugins/onedrive/assets/service_32.png" class="onedrive_icon file_service_icon grayscale" /></a>
					{{/if_equal}}
				{{/if}}
				{{#if is_mention}}Mentioned{{else}}Shared{{/if}} {{#if uploader}}{{{makeMemberPreviewLinkById uploader.id false}}}{{possessive uploader.name}}{{else}}{{/if}} 
				{{#if file.is_external}}
					{{{external_filetype_html}}}
				{{else}}
					{{#if_equal file.filetype compare='space'}}
						Post
					{{else}}
						File
					{{/if_equal}}
				{{/if}}
				{{#unless file.is_external}}
					{{#if_not_equal file.filetype compare='space'}}
						<span class="bullet">•</span>
						<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" data-file-id="{{file.id}}" class="file_download_link file_ssb_download_link" title="Download this file">{{convertFilesize file.size}} <span>{{file.pretty_type}}</span></a>
					{{/if_not_equal}}
				{{/unless}}
				<span class="file_share_shared_label{{#unless file.is_shared}} hidden{{/unless}}" data-file-id="{{file.id}}">
					<span class="bullet">•</span> {{{makeFileShareLabel file}}}
				</span>
				{{#unless standalone}}
					<span class="bullet">•</span>
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">
						{{#if file.comments_count}}{{pluralCount file.comments_count 'comment' 'comments'}}{{else}}Add comment{{/if}}
					</a>
				{{/unless}}
				{{#fileIsImage id=file.id}}
					<span class="bullet">•</span>
					<a href="{{file.url_private}}" target="{{file.url_private}}" data-file-id="{{file.id}}">Open original</a>
				{{/fileIsImage}}				
			</span>

			{{#unless standalone}}
				{{#if show_initial_comment}}
				{{#if file.initial_comment}}
					<div class="initial_comment">
						<i class="icon_quote float_left ts_icon ts_icon_quote"></i>
						<div class="comment no_bottom_margin">
							{{{formatMessage file.initial_comment.comment}}}
						</div>
						{{{rxnPanel file.initial_comment._rxn_key rxn_options}}}
					</div>
				{{/if}}
				{{/if}}
			{{/unless}}

		{{/isTheme}}		

	</div>
</script>
<script id="message_screenhero_attachment_template" type="text/x-handlebars-template">{{!
"room": {
	"id": "R060193UZ",
	"name": null,
	"created_by": "U024BE7LM",
	"date_start": "1434639486",
	"date_end": "0",
	"participants": [],
	"channels": [
		"C02QNRADD"
	]
}
// TODO
[ ] Inline expander

}}

<div class="sh_call_container {{makeSHRoomClass room.id}} {{#if room.date_end}}sh_call_ended{{/if}} {{#unless can_make_calls}}sh_call_ended{{/unless}} {{#unless expand_it}}sh_call_collapsed{{/unless}}" data-room-id="{{ room.id }}">
	<span class="meta">
	{{#if did_room_start_in_channel}}
		{{#if room.participants.length}}
			Started
		{{else}}
			Starting
		{{/if}}
	{{else}}
		Shared
	{{/if}} 
	a call<span class="furled_desc">: 
	{{#unless room.date_end}}
		<a class="room_name" href="{{share_url_prefix}}{{room.id}}" target="screenhero_{{room.id}}">
	{{~/unless~}}
	{{~#if room.name~}}
		{{room.name}} call
	{{~else~}}
		Untitled
	{{~/if~}}
	{{~#unless room.date_end~}}
		</a>
	{{/unless}}
	</span>
	{{{inlineRoomPreviewToggler room.id}}}
	</span>
	<div class="screenhero_attachment clearfix">
		<i class="ts_icon {{#if room.date_end}}ts_icon_phone_flat{{else}}ts_icon_phone{{/if}}"></i>
		<div>
			{{#if room.is_dm_call}}
			<p class="no_bottom_margin">
				{{#if room.date_end}}
					{{#if room.was_missed}}
						{{#if is_creator}}
							{{dm_member_name}} 
						{{else}} 
						You
						{{/if}}{{#if room.was_rejected}}
						declined
						{{else}}
						missed
						{{/if}} the call
					{{else}}
						This call has ended
					{{/if}}
				{{else}}
					{{#if is_creator}}
						<a target="screenhero_{{room.id}}" href="{{share_url_prefix}}{{room.id}}">{{#if_equal room.participants.length compare=2}}On a call with {{dm_member_name}}{{else}}Calling {{dm_member_name}}{{#repeat 3}}<span class="animated_ellipsis">.</span>{{/repeat}}{{/if_equal}}</a>
					{{else}}
						<a target="screenhero_{{room.id}}" href="{{share_url_prefix}}{{room.id}}">{{#if_equal room.participants.length compare=2}}On a call with {{dm_member_name}}{{else}}{{dm_member_name}} is calling you{{#repeat 3}}<span class="animated_ellipsis">.</span>{{/repeat}}{{/if_equal}}</a>
					{{/if}}
				{{/if}}
			</p>
			<p class="call_subinfo no_bottom_margin">
				Started at {{toTime room.date_start}}
				{{#if room.date_end}}
					{{#unless room.was_missed}}
						and lasted <b>{{toTimeDuration duration}}</b>
					{{/unless}}
				{{/if}}
			</p>
			{{else}}
			<p class="no_bottom_margin">
				{{#if room.date_end}}
					{{#if room.name}}
						<span class="room_name">{{room.name}}</span> call has ended
					{{else}}
						This call has ended
					{{/if}}
				{{else}}
					{{#if room.name}}
						<span class="room_name">{{room.name}}</span> <span class="pipe_separator">|</span>
					{{/if}}
					{{#if can_make_calls}}
						<a target="screenhero_{{room.id}}" href="{{share_url_prefix}}{{room.id}}">{{#if currently_in_call}}You are on this call{{else}}Join this call{{/if}}</a>
					{{else}}
						Loading...
					{{/if}}
				{{/if}}
			</p>
			<p class="call_subinfo no_bottom_margin">
					{{#if room.date_end}}
						Lasted <b>{{toTimeDuration duration}}</b> with <span class="participant_list">{{{makeSHRoomParticipantList room}}}</span>
					{{else}}
						Started at {{toTime room.date_start}}
						{{#if room.participants.length}}<span class="participant_count"><i class="ts_icon ts_icon_user"></i>{{room.participants.length}}</span>
							{{#each participant_objects}}
								<span class="ts_tip ts_tip_top participant">
									{{{makeMemberPreviewLinkImage this.id 24}}}
									<span class="ts_tip_tip">
										{{#if this.profile.real_name}}
											{{this.profile.real_name}}
										{{else}}
											{{this.name}}
										{{/if}}
									</span>
								</span>
							{{/each}}
						{{/if}}
					{{/if}}
			</p>
			{{/if}}
		</div>
	</div>
</div>
</script>
<script id="message_file_post_share_old_template" type="text/x-handlebars-template">{{! DEPRECATED_FILE_NOTICE: This file is replaced by file.hbs with the release of feature_fix_files. }}
	<div id="{{makeMsgDomId msg.ts}}" class="{{#if msg.no_display}}hidden{{/if}} message file_reference {{#if is_mention}}file_mention{{else}}file_share{{/if}} {{#if first_in_block}}first{{/if}} {{#if unread}}unread{{/if}} {{#if highlight}}highlight{{/if}} {{#if show_divider}}divider{{/if}} show_user {{#showAvatars}}avatar{{/showAvatars}}" data-ts="{{msg.ts}}">

		{{#unless unprocessed}}
			{{#unless standalone}}
				{{#if show_actions_cog}}
					{{{msgActions msg}}}
				{{/if}}
			{{/unless}}
		{{/unless}}

		{{#showAvatars}}
			{{#feature flag="feature_email_integration"}}
				{{makeProfileImage member size=36}}
			{{else}}
				{{{makeMemberPreviewLinkImage member.id 36}}}
			{{/feature}}
		{{/showAvatars}}

		{{#isTheme theme='dense'}}

			<span class="message_star_holder">{{{star 'file' file null}}}</span>
			
			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}
		
			{{#if uploader}}
				<em>{{{makeMemberPreviewLink member}}} {{#if is_mention}}mentioned{{else}}shared{{/if}}:</em>
			{{/if}}
		
			<div class="post_meta">
				<span class="float_left small_right_margin">
					{{{makeMemberPreviewLinkImage file.user 32}}}
				</span>
				<span class="float_left" style="width: 85%">				
					{{{makeMemberPreviewLinkById file.user false}}} {{#unless uploader}}{{#if is_mention}}mentioned{{else}}shared{{/if}}:{{/unless}}<br />
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_name bold">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</a>
					<a href="{{file.permalink}}" target="{{file.permalink}}" class="ts_icon ts_icon_external_link icon_new_window" title="Open file page"></a><br />				
				</span>
				<div class="clear_both"></div>				
			</div>

			{{#unless standalone}}
				<div class="post_preview">
					{{{smartnl2br file.preview}}}
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file.id}}" class="file_preview_link">more</a>
				</div>
					
				{{{rxnPanel file._rxn_key rxn_options}}}

				<span class="meta block post_meta">
					{{#memberIsSelf id=member.id}} 
						{{#unless uploader}}
							<a href="{{file.permalink}}/edit">Edit</a>
							<span class="bullet">•</span>
						{{/unless}}
					{{/memberIsSelf}}
					<a href="{{file.permalink}}" target="{{file.id}}">New window</a>
					<span class="bullet">•</span>
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">
						{{#if file.comments_count}}{{pluralCount file.comments_count 'comment' 'comments'}}{{else}}Add comment{{/if}}
					</a>
				</span>
		
				{{#if show_initial_comment}}
					{{#if file.initial_comment}}
						<p class="small_top_margin no_bottom_margin">{{{formatMessage file.initial_comment.comment}}}</p>
						{{{rxnPanel file.initial_comment._rxn_key rxn_options}}}
					{{/if}}
				{{/if}}
			{{/unless}}

		{{/isTheme}}

		{{#isTheme theme='light'}}

			<a href="/team/{{member.name}}" {{#isClient}}target="/team/{{member.name}}"{{/isClient}} class="member {{getMemberColorClassById member.id}} message_sender" data-member-id="{{member.id}}">{{getMemberDisplayName member}}</a>

			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}
			
			<span class="message_star_holder">{{{star 'file' file null}}}</span><br />
			
			{{#if jump_link}}{{{jump_link}}}{{/if}}
				
			<span class="meta">
				{{#if is_mention}}Mentioned{{else}}Shared{{/if}} {{#if uploader}}{{{makeMemberPreviewLinkById uploader.id false}}}'s{{else}}a{{/if}} Post: 
				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file.id}}" class="file_preview_link file_name">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</a>
				<a href="{{file.permalink}}" target="{{newWindowName}}" data-toggle="tooltip" title="Open post in a new tab" aria-label="Open post in a new tab"><i class="ts_icon ts_icon_external_link file_inline_icon"></i></a>
			</span>
					
			{{#unless standalone}}
				<div class="post_preview">
					{{{smartnl2br file.preview}}}
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file.id}}" class="file_preview_link">more</a>
				</div>
					
				{{{rxnPanel file._rxn_key rxn_options}}}
			
				<span class="meta block post_meta">
					{{#memberIsSelf id=member.id}} 
						{{#unless uploader}}
							<a href="{{file.permalink}}/edit">Edit</a>
							<span class="bullet">•</span>
						{{/unless}}
					{{/memberIsSelf}}
					<a href="{{file.permalink}}" target="{{file.id}}">New window</a>
					<span class="bullet">•</span>
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">
						{{#if file.comments_count}}{{pluralCount file.comments_count 'comment' 'comments'}}{{else}}Add comment{{/if}}
					</a>
				</span>
		
				{{#if show_initial_comment}}
					{{#if file.initial_comment}}
						<div class="initial_comment">
							<i class="icon_quote float_left ts_icon ts_icon_quote"></i>
							<p class="no_bottom_margin">
								{{{formatMessage file.initial_comment.comment}}}
							</p>
							{{{rxnPanel file.initial_comment._rxn_key rxn_options}}}
						</div>
					{{/if}}
				{{/if}}
			{{/unless}}

		{{/isTheme}}		
		
	</div>
</script>
<script id="message_file_space_share_old_template" type="text/x-handlebars-template">{{! DEPRECATED_FILE_NOTICE: This file is replaced by file.hbs with the release of feature_fix_files. }}
	<div id="{{makeMsgDomId msg.ts}}" class="{{#if msg.no_display}}hidden{{/if}} message file_reference {{#if is_mention}}file_mention{{else}}file_share{{/if}} {{#if first_in_block}}first{{/if}} {{#if unread}}unread{{/if}} {{#if highlight}}highlight{{/if}} {{#if show_divider}}divider{{/if}} show_user {{#showAvatars}}avatar{{/showAvatars}}" data-ts="{{msg.ts}}">

		{{#unless unprocessed}}
			{{#unless standalone}}
				{{#if show_actions_cog}}
					{{{msgActions msg}}}
				{{/if}}
			{{/unless}}
		{{/unless}}

		{{#showAvatars}}
			{{{makeMemberPreviewLinkImage member.id 36}}}
		{{/showAvatars}}

		{{#isTheme theme='dense'}}

			<span class="message_star_holder">{{{star 'file' file null}}}</span>
			
			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}
		
			{{#if uploader}}
				<em>{{{makeMemberPreviewLink member}}} {{#if is_mention}}mentioned{{else}}shared{{/if}}:</em>
			{{/if}}
		
			<div class="space_meta">
				<span class="float_left small_right_margin">
					{{{makeMemberPreviewLinkImage file.user 32}}}
				</span>
				<span class="float_left" style="width: 85%">				
					{{{makeMemberPreviewLinkById file.user false}}} {{#unless uploader}}{{#if is_mention}}mentioned{{else}}shared{{/if}}:{{/unless}}<br />
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_name bold">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</a>
					<a href="{{file.permalink}}" target="{{file.permalink}}" data-file-id="{{file.id}}" class="ts_icon ts_icon_external_link file_new_window_link icon_new_window" title="Open file page"></a><br />				
				</span>
				<div class="clear_both"></div>				
			</div>

			{{#unless standalone}}
				<div class="space_preview post_body">
					{{{file.preview}}}
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file.id}}" class="file_preview_link">more</a>
				</div>
					
				{{{rxnPanel file._rxn_key rxn_options}}}

				<span class="meta block space_meta">
					{{#feature flag="feature_spaces"}}{{else}}<a href="{{file.permalink}}" target="{{file.id}}">New window</a>
					<span class="bullet">•</span>{{/feature}}
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">
						{{#if file.comments_count}}{{pluralCount file.comments_count 'comment' 'comments'}}{{else}}Add comment{{/if}}
					</a>
				</span>
		
				{{#if show_initial_comment}}
					{{#if file.initial_comment}}
						<p class="small_top_margin no_bottom_margin">{{{formatMessage file.initial_comment.comment}}}</p>
						{{{rxnPanel file.initial_comment._rxn_key rxn_options}}}
					{{/if}}
				{{/if}}
			{{/unless}}

		{{/isTheme}}

		{{#isTheme theme='light'}}

			<a href="/team/{{member.name}}" {{#isClient}}target="/team/{{member.name}}"{{/isClient}} class="member {{getMemberColorClassById member.id}} message_sender" data-member-id="{{member.id}}">{{getMemberDisplayName member}}</a>

			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}
			
			<span class="message_star_holder">{{{star 'file' file null}}}</span><br />
			
			{{#if jump_link}}{{{jump_link}}}{{/if}}
				
			<span class="meta">
				<i class="ts_icon ts_icon_arrow_circle_o_right ts_icon_inherit float_left"></i> {{#if is_mention}}Mentioned{{else}}Shared{{/if}} {{#if uploader}}{{{makeMemberPreviewLinkById uploader.id false}}}'s{{else}}a{{/if}} Post: 
				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file.id}}" class="file_preview_link file_name">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</a>
				<a href="{{file.permalink}}" target="{{newWindowName}}" data-toggle="tooltip" title="Open space in a new tab" aria-label="Open space in a new tab" data-file-id="{{file.id}}" class="file_new_window_link"><i class="ts_icon ts_icon_external_link file_inline_icon"></i></a>
			</span>
					
			{{#unless standalone}}
				<div class="space_preview post_body">
					{{{file.preview}}}
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file.id}}" class="file_preview_link">more</a>
				</div>
					
				{{{rxnPanel file._rxn_key rxn_options}}}
			
				<span class="meta block space_meta">
					{{#feature flag="feature_spaces"}}{{else}}<a href="{{file.permalink}}" target="{{file.id}}">New window</a>
					<span class="bullet">•</span>{{/feature}}
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">
						{{#if file.comments_count}}{{pluralCount file.comments_count 'comment' 'comments'}}{{else}}Add comment{{/if}}
					</a>
				</span>
		
				{{#if show_initial_comment}}
					{{#if file.initial_comment}}
						<div class="initial_comment">
							<i class="icon_quote float_left ts_icon ts_icon_quote"></i>
							<p class="no_bottom_margin">
								{{{formatMessage file.initial_comment.comment}}}
							</p>
							{{{rxnPanel file.initial_comment._rxn_key rxn_options}}}
						</div>
					{{/if}}
				{{/if}}
			{{/unless}}

		{{/isTheme}}		
		
	</div>
</script>
<script id="message_file_snippet_share_old_template" type="text/x-handlebars-template">{{! DEPRECATED_FILE_NOTICE: This file is replaced by file.hbs with the release of feature_fix_files. }}
	<div id="{{makeMsgDomId msg.ts}}" class="{{#if msg.no_display}}hidden{{/if}} message file_reference {{#if is_mention}}file_mention{{else}}file_share{{/if}} {{#if first_in_block}}first{{/if}} {{#if unread}}unread{{/if}} {{#if highlight}}highlight{{/if}} {{#if show_divider}}divider{{/if}} show_user {{#showAvatars}}avatar{{/showAvatars}}" data-ts="{{msg.ts}}">

		{{#unless unprocessed}}
			{{#unless standalone}}
				{{#if show_actions_cog}}
					{{{msgActions msg}}}
				{{/if}}
			{{/unless}}
		{{/unless}}

		{{#showAvatars}}
			{{{makeMemberPreviewLinkImage member.id 36}}}
		{{/showAvatars}}

		{{#isTheme theme='dense'}}
			<span class="message_star_holder">{{{star 'file' file null}}}</span>
			
			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}
			{{#if uploader}}
				<em>{{{makeMemberPreviewLink member}}} {{#if is_mention}}mentioned{{else}}shared{{/if}}:</em>
			{{/if}}

			<div class="meta">
				<span class="float_left small_right_margin">
					{{{makeMemberPreviewLinkImage file.user 32}}}
				</span>
				<span class="float_left" style="width: 85%">
					{{{makeMemberPreviewLinkById file.user false}}} {{#unless uploader}}{{#if is_mention}}mentioned{{else}}shared{{/if}}:{{/unless}}<br />
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_name bold">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</a>
					<a href="{{file.permalink}}" target="{{file.permalink}}" class="ts_icon ts_icon_external_link icon_new_window" title="Open file page"></a>
				</span>
				<div class="clear_both"></div>				
			</div>
		
			{{#unless standalone}}
				<div class="snippet_preview">
					{{{file.preview_highlight}}}
					{{#if_gt file.lines_more compare=0}}
						<a href="{{file.permalink}}" data-file-id="{{file.id}}" class="file_preview_link snippet_preview_more" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}">+ {{file.lines_more}} more line{{#if_gt file.lines_more compare=1}}s{{/if_gt}}...</a>
					{{/if_gt}}
				</div>
					
				{{{rxnPanel file._rxn_key rxn_options}}}
		
				<div class="snippet_meta">
					<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" title="Download this file">{{convertFilesize file.size}} <span>{{file.pretty_type}}</span></a>
					<span class="bullet">•</span>
					{{#memberIsSelf id=member.id}} 
						{{#unless uploader}}
							<a href="{{file.edit_link}}" target="{{file.id}}" class="file_edit" onclick="TS.ui.snippet_dialog.startEdit('{{file.id}}'); return false">Edit</a> <span class="bullet">•</span>
						{{/unless}}
					{{/memberIsSelf}}
					<a href="{{file.permalink}}" target="{{file.id}}">New window</a>
					<span class="bullet">•</span> 
					<a href="{{file.url_private}}" target="{{file.id}}">View raw</a>
					<span class="bullet">•</span>
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">
						{{#if file.comments_count}}{{pluralCount file.comments_count 'comment' 'comments'}}{{else}}Add comment{{/if}}
					</a>
				</div>

				{{#if show_initial_comment}}
				{{#if file.initial_comment}}
					<p class="small_top_margin no_bottom_margin">{{{formatMessage file.initial_comment.comment}}}</p>
					{{{rxnPanel file.initial_comment._rxn_key rxn_options}}}
				{{/if}}
				{{/if}}
			{{/unless}}

		{{/isTheme}}

		{{#isTheme theme='light'}}

			<a href="/team/{{member.name}}" {{#isClient}}target="/team/{{member.name}}"{{/isClient}} class="member {{getMemberColorClassById member.id}} message_sender" data-member-id="{{member.id}}">{{getMemberDisplayName member}}</a>

			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}
			
			<span class="message_star_holder">{{{star 'file' file null}}}</span><br />
			
			{{#if jump_link}}{{{jump_link}}}{{/if}}

			<span class="meta">
				<i class="ts_icon ts_icon_arrow_circle_o_right ts_icon_inherit float_left"></i> {{#if is_mention}}Mentioned{{else}}Shared{{/if}} {{#if uploader}}{{{makeMemberPreviewLinkById uploader.id false}}}'s{{else}}a{{/if}} snippet: 
				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_name">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</a>
			</span><br />

			{{#unless standalone}}
				<div class="snippet_preview">
					{{{file.preview_highlight}}}
					{{#if_gt file.lines_more compare=0}}
						<a href="{{file.permalink}}" data-file-id="{{file.id}}" class="file_preview_link snippet_preview_more" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}">+ {{file.lines_more}} more line{{#if_gt file.lines_more compare=1}}s{{/if_gt}}...</a>
					{{/if_gt}}
				</div>
					
				{{{rxnPanel file._rxn_key rxn_options}}}
			
				<span class="meta block snippet_meta">
					<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" title="Download this file">{{convertFilesize file.size}} <span>{{file.pretty_type}}</span></a>
					<span class="bullet">•</span> 
					{{#memberIsSelf id=member.id}} 
						{{#unless uploader}}
							<a href="{{file.edit_link}}" target="{{file.id}}" class="file_edit" onclick="TS.ui.snippet_dialog.startEdit('{{file.id}}'); return false">Edit</a> <span class="bullet">•</span>
						{{/unless}}
					{{/memberIsSelf}}
					<a href="{{file.permalink}}" target="{{file.id}}">New window</a>
					<span class="bullet">•</span> 
					<a href="{{file.url_private}}" target="{{file.id}}">View raw</a>
					<span class="bullet">•</span>
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">
						{{#if file.comments_count}}{{pluralCount file.comments_count 'comment' 'comments'}}{{else}}Add comment{{/if}}
					</a>
				</span>

				{{#if show_initial_comment}}
				{{#if file.initial_comment}}
					<div class="initial_comment">
						<i class="icon_quote float_left ts_icon ts_icon_quote"></i>
						<div class="comment no_bottom_margin">
							{{{formatMessage file.initial_comment.comment}}}
						</div>
						{{{rxnPanel file.initial_comment._rxn_key rxn_options}}}
					</div>
				{{/if}}
				{{/if}}
			{{/unless}}

		{{/isTheme}}		

	</div>
</script>
	<script id="message_file_email_share_old_template" type="text/x-handlebars-template">{{! DEPRECATED_FILE_NOTICE: This file is replaced by file.hbs with the release of feature_fix_files. }}
	<div id="{{makeMsgDomId msg.ts}}" class="{{#if msg.no_display}}hidden{{/if}} message file_reference {{#if is_mention}}file_mention{{else}}file_share{{/if}} {{#if first_in_block}}first{{/if}} {{#if unread}}unread{{/if}} {{#if highlight}}highlight{{/if}} {{#if show_divider}}divider{{/if}} show_user {{#showAvatars}}avatar{{/showAvatars}}" data-ts="{{msg.ts}}">

		{{#unless unprocessed}}
			{{#unless standalone}}
				{{#if show_actions_cog}}
					{{{msgActions msg}}}
				{{/if}}
			{{/unless}}
		{{/unless}}

		{{#showAvatars}}
			{{#feature flag="feature_email_integration"}}
				{{makeProfileImage member size=36}}
			{{else}}
				{{{makeMemberPreviewLinkImage member.id 36}}}
			{{/feature}}
		{{/showAvatars}}

		{{#isTheme theme='dense'}}
			<span class="message_star_holder">{{{star 'file' file null}}}</span>

			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}

			<em {{#feature flag="feature_fix_files"}}{{#unless standalone}}data-file-id="{{file.id}}" class="dense_meta msg_inline_file_preview_toggler {{#isInlineFilePreviewExpanded container_id=msg_dom_id file_id=file.id}}expanded{{else}}collapsed{{/isInlineFilePreviewExpanded}}"{{/unless}}{{/feature}}>
				{{{makeMemberPreviewLink member}}}

				{{#feature flag="feature_fix_files"}}<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}">{{/feature}}
					{{#if is_added}}added{{else}}{{#if is_mention}}mentioned{{else}}shared{{/if}}{{/if}}
					{{#if uploader}}
						{{#feature flag="feature_fix_files"}}</a>{{/feature}}
						{{{makeMemberPreviewLinkById uploader.id false}}}
						{{~possessiveForMember uploader~}}
						{{#feature flag="feature_fix_files"}}<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}">{{/feature}}
					{{else}}
						an
					{{/if}}
					email<span class="msg_inline_file_title_hider {{#feature flag="feature_fix_files"}}{{else}}{{#isInlineFilePreviewExpanded container_id=msg_dom_id file_id=file.id}} hidden{{/isInlineFilePreviewExpanded}}" data-file-id="{{file.id}}{{/feature}}">:
						{{#feature flag="feature_fix_files"~}}<span class="file_preview_link bold msg_inline_file_preview_title">{{else}}<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_name">{{/feature}}
						{{~#if file.title~}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}
						{{~#feature flag="feature_fix_files"}}</span>{{else}}</a>{{/feature}}
					</span>

					{{#unless standalone}}
						{{#feature flag="feature_fix_files"}}
							<i class="ts_icon ts_icon_caret_down"></i>
							<i class="ts_icon ts_icon_caret_right"></i>
						{{else}}
							{{{inlineFilePreviewToggler file.id msg_dom_id hide_title_when_expanded=true}}}
						{{/feature}}
					{{/unless}}
				</a>
			</em>

		{{/isTheme}}{{!--/dense--}}

		{{#isTheme theme='light'}}

			{{#feature flag="feature_email_integration"}}
				{{#if member.is_bot}}
					<a href="/services/{{member.id}}" {{#isClient}}target="/services/{{member.id}}"{{/isClient}} class="{{getMemberColorClassById member.id}} message_sender" data-member-id="{{member.id}}">{{getMemberDisplayName member}}</a>{{#if is_bot}}<span class="bot_label">BOT</span>{{/if}}
				{{else}}
					<a href="/team/{{member.name}}" {{#isClient}}target="/team/{{member.name}}"{{/isClient}} class="member {{getMemberColorClassById member.id}} message_sender" data-member-id="{{member.id}}">{{getMemberDisplayName member}}</a>
				{{/if}}
			{{else}}
				<a href="/team/{{member.name}}" {{#isClient}}target="/team/{{member.name}}"{{/isClient}} class="member {{getMemberColorClassById member.id}} message_sender" data-member-id="{{member.id}}">{{getMemberDisplayName member}}</a>{{#if is_bot}}<span class="bot_label">BOT</span>{{/if}}
			{{/feature}}

			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}

			<span class="message_star_holder">{{{star 'file' file null}}}</span>

			<br />

			{{#if jump_link}}{{{jump_link}}}{{/if}}

			<span data-file-id="{{file.id}}" class="meta{{#feature flag="feature_fix_files"}}{{#unless standalone}} msg_inline_file_preview_toggler {{#isInlineFilePreviewExpanded container_id=msg_dom_id file_id=file.id}}expanded{{else}}collapsed{{/isInlineFilePreviewExpanded}}{{/unless}}{{/feature}}">
				{{#feature flag="feature_fix_files"}}<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}">{{/feature}}
					{{~#if is_added}}Added{{else}}{{#if is_mention}}Mentioned{{else}}Shared{{/if}}{{/if}}
					{{#if uploader}}
						{{#feature flag="feature_fix_files"}}</a>{{/feature}}
						{{{makeMemberPreviewLinkById uploader.id false}}}
						{{~possessiveForMember uploader~}}
						{{#feature flag="feature_fix_files"}}<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}">{{/feature}}
					{{else}}
						an
					{{/if}}
					email<span class="msg_inline_file_title_hider {{#feature flag="feature_fix_files"}}{{else}}{{#isInlineFilePreviewExpanded container_id=msg_dom_id file_id=file.id}} hidden{{/isInlineFilePreviewExpanded}}" data-file-id="{{file.id}}{{/feature}}">:
						{{#feature flag="feature_fix_files"~}}<span class="file_preview_link bold msg_inline_file_preview_title">{{else}}<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_name">{{/feature}}
						{{~#if file.title~}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}
						{{~#feature flag="feature_fix_files"}}</span>{{else}}</a>{{/feature}}
					</span>

					{{#unless standalone}}
						{{#feature flag="feature_fix_files"}}
							<i class="ts_icon ts_icon_caret_down"></i>
							<i class="ts_icon ts_icon_caret_right"></i>
						{{else}}
							{{{inlineFilePreviewToggler file.id msg_dom_id hide_title_when_expanded=true}}}
						{{/feature}}
					{{/unless}}
				</a>
			</span>

		{{/isTheme}}{{!--/light--}}

		{{#unless standalone}}
			{{{inlineEmailDiv file.id msg_dom_id}}}
					
			{{{rxnPanel file._rxn_key rxn_options}}}

			{{#if show_initial_comment}}
				{{#if file.initial_comment}}
					<div class="initial_comment">
						<i class="icon_quote float_left ts_icon ts_icon_quote"></i>
						<p class="no_bottom_margin">
							{{{formatMessage file.initial_comment.comment}}}
						</p>
						{{{rxnPanel file.initial_comment._rxn_key rxn_options}}}
					</div>
				{{/if}}
			{{/if}}
		{{/unless}}
	</div>
</script>
<script id="member_profile_image_template" type="text/x-handlebars-template">{{#if is_static}}
	<span>
		its the static file you jabroni.
	</span>
{{else}}
	<a
		{{#if is_targettable}} href="/team/{{entity.name}}" target="/team/{{entity.name}}" {{/if}}
		{{#if entity}} data-member-id="{{entity.id}}" {{/if}}
		{{#if size}} data-thumb-size="{{size}}" {{/if}}
		{{#if image}} style="background-image: {{image}}" {{/if}}
								class="member_preview_link member_image {{css_classes}} {{#if entity.is_restricted}}ra{{/if}} {{#if entity.is_ultra_restricted}}ura{{/if}}"
	></a>
{{/if}}
</script>
<script id="message_file_upload_old_template" type="text/x-handlebars-template">{{! DEPRECATED_FILE_NOTICE: This file is replaced by file.hbs with the release of feature_fix_files. }}
	<div id="{{makeMsgDomId msg.ts}}" class="message file_reference file_upload {{#if first_in_block}}first{{/if}} {{#if unread}}unread{{/if}} {{#if highlight}}highlight{{/if}} {{#if show_divider}}divider{{/if}} show_user {{#showAvatars}}avatar{{/showAvatars}}" data-ts="{{msg.ts}}">

		{{#unless unprocessed}}
			{{#unless standalone}}
				{{#if show_actions_cog}}
					{{{msgActions msg}}}
				{{/if}}
			{{/unless}}
		{{/unless}}

		{{#showAvatars}}
			{{{makeMemberPreviewLinkImage member.id 36}}}
		{{/showAvatars}}
		
		{{#isTheme theme='dense'}}

			<span class="message_star_holder">{{{star 'file' file null}}}</span>
			
			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}

			<div class="file_details">

				{{#if file.is_external}}
					<a href="{{fileUrl file}}" {{#isClient}}target="{{fileUrl file}}"{{/isClient}} data-file-id="{{file.id}}" class="icon {{icon_class}}" title="Open original in new tab">
				{{else}}
					{{#fileIsImage id=file.id}}
						<a href="{{file.url_private}}" {{#isClient}}target="{{file.url_private}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link icon {{icon_class}} {{#if lightbox}}lightbox_link{{/if}}" title="Open in lightbox ({{#isMac}}cmd{{else}}ctrl{{/isMac}}+click to open original in new tab)">
					{{else}}
						<a href="{{file.url_private}}" {{#isClient}}target="{{file.url_private}}"{{/isClient}} data-file-id="{{file.id}}" class="icon {{icon_class}}" title="Open original in new tab">
					{{/fileIsImage}}
				{{/if}}
					{{#if file.thumb_80}}
						{{#if_equal icon_class compare="thumb_80"}}
							<img src="{{#if file.thumb_160}}{{file.thumb_160}}{{else}}{{file.thumb_80}}{{/if}}" {{#if file.thumb_160}}srcset="{{file.thumb_80}} 1x, {{file.thumb_160}} 2x"{{/if}} />
						{{else}}
							<img src="{{file.thumb_360}}" />
						{{/if_equal}}
					{{else}}
						<span data-file-id="{{file.id}}" class="filetype_icon s48 {{file.filetype}}"></span>
					{{/if}}
					{{#if show_initial_comment}}{{#if file.initial_comment}}<i class="ts_icon ts_icon_comment icon_comment"></i>{{/if}}{{/if}}
				</a>

				<em>
					<a href="/team/{{member.name}}" {{#isClient}}target="/team/{{member.name}}"{{/isClient}} class="member bold {{getMemberColorClassById member.id}}" data-member-id="{{member.id}}">{{getMemberDisplayName member}}</a> uploaded 
					{{#if show_initial_comment}}{{#if file.initial_comment}}and commented on{{/if}}{{/if}}
					a file: 			
				</em>

				<a href="{{#if file.is_external}}{{fileUrl file}}{{else}}{{file.permalink}}{{/if}}" target="{{#if file.is_external}}{{fileUrl file}}{{else}}{{file.permalink}}{{/if}}" class="ts_icon ts_icon_external_link ts_icon_inherit icon_new_window" title="{{#if file.is_external}}Open original in new tab{{else}}Open file page{{/if}}"></a><br />

				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_name">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</a> 
				
				{{#unless file.thumb_360}}
					<a href="{{file.url_private_download}}" target="{{newWindowName}}" data-toggle="tooltip" title="Download file" aria-label="Download file" data-file-id="{{file.id}}" class="file_ssb_download_icon"><i class="ts_icon ts_icon_cloud_download file_inline_icon"></i></a>
				{{/unless}}				
				
				{{#unless standalone}}
					{{#if show_retina_thumb}}
						{{#if file.thumb_360_gif}}
							{{{inlineImgToggler file.thumb_360_gif msg_dom_id}}}
						{{else}}
							{{{inlineImgToggler file.thumb_720 msg_dom_id}}}
						{{/if}}
					{{else}}
						{{#if file.thumb_360_gif}}
							{{{inlineImgToggler file.thumb_360_gif msg_dom_id}}}
						{{else}}
							{{{inlineImgToggler file.thumb_360 msg_dom_id}}}
						{{/if}}
					{{/if}}<br />
				{{/unless}}

				<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" class="file_download_link file_ssb_download_link" data-file-id="{{file.id}}" title="Download this file">{{convertFilesize file.size}} {{file.pretty_type}} file</a>

				<span class="file_share_shared_label{{#unless file.is_shared}} hidden{{/unless}}" data-file-id="{{file.id}}">
					<span class="bullet">•</span> {{{makeFileShareLabel file}}}
				</span>

				{{#unless standalone}}
					<span class="bullet">•</span>
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">
						{{#if file.comments_count}}{{pluralCount file.comments_count 'comment' 'comments'}}{{else}}Add comment{{/if}}
					</a>
				{{/unless}}
				
				{{#fileIsImage id=file.id}}
					<span class="bullet">•</span>
					<a href="{{file.url_private}}" target="{{file.url_private}}" data-file-id="{{file.id}}">Open original</a>
				{{/fileIsImage}}

			</div>
			
			{{#unless standalone}}
				{{#if show_initial_comment}}
				{{#if file.initial_comment}}
					<div class="initial_comment no_bottom_margin">{{{formatMessage file.initial_comment.comment}}}</div>
					{{{rxnPanel file.initial_comment._rxn_key rxn_options}}}
				{{/if}}
				{{/if}}

				{{#if show_retina_thumb}}
					{{#if file.thumb_360_gif}}
						{{{inlineImgDiv file.thumb_360_gif msg_dom_id}}}
					{{else}}
						{{{inlineImgDiv file.thumb_720 msg_dom_id}}}
					{{/if}}
				{{else}}
					{{#if file.thumb_360_gif}}
						{{{inlineImgDiv file.thumb_360_gif msg_dom_id}}}
					{{else}}
						{{{inlineImgDiv file.thumb_360 msg_dom_id}}}
					{{/if}}
				{{/if}}
				
				{{{rxnPanel file._rxn_key rxn_options}}}
			{{/unless}}
			
		{{/isTheme}}
		
		{{#isTheme theme='light'}}
			<a href="/team/{{member.name}}" {{#isClient}}target="/team/{{member.name}}"{{/isClient}} class="member {{getMemberColorClassById member.id}} message_sender" data-member-id="{{member.id}}">{{getMemberDisplayName member}}</a>
			
			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}
			
			<span class="message_star_holder">{{{star 'file' file null}}}</span><br />	
			
			{{#if jump_link}}{{{jump_link}}}{{/if}}

			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file.id}}" class="file_preview_link file_name">
				{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}
			</a>
			{{#unless file.thumb_360}}
				<a href="{{file.url_private_download}}" target="{{newWindowName}}" data-toggle="tooltip" title="Download file" aria-label="Download file" data-file-id="{{file.id}}" class="file_ssb_download_link"><i class="ts_icon ts_icon_cloud_download file_inline_icon"></i></a>
			{{/unless}}

			{{#unless standalone}}
				{{#if show_retina_thumb}}
					{{#if file.thumb_360_gif}}
						{{{inlineImgToggler file.thumb_360_gif msg_dom_id}}}
					{{else}}
						{{{inlineImgToggler file.thumb_720 msg_dom_id}}}
					{{/if}}
				{{else}}
					{{#if file.thumb_360_gif}}
						{{{inlineImgToggler file.thumb_360_gif msg_dom_id}}}
					{{else}}
						{{{inlineImgToggler file.thumb_360 msg_dom_id}}}
					{{/if}}
				{{/if}}
			{{/unless}}

			<br />

			{{#unless standalone}}
				{{#if show_retina_thumb}}
					{{#if file.thumb_360_gif}}
						{{{inlineImgDiv file.thumb_360_gif msg_dom_id}}}
					{{else}}
						{{{inlineImgDiv file.thumb_720 msg_dom_id}}}
					{{/if}}
				{{else}}
					{{#if file.thumb_360_gif}}
						{{{inlineImgDiv file.thumb_360_gif msg_dom_id}}}
					{{else}}
						{{{inlineImgDiv file.thumb_360 msg_dom_id}}}
					{{/if}}
				{{/if}}
				
				{{{rxnPanel file._rxn_key rxn_options}}}
			{{/unless}}

			<span class="meta">
				<i class="ts_icon ts_icon_arrow_circle_up"></i> 
				<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" data-file-id="{{file.id}}" class="file_download_link file_ssb_download_link" title="Download this file">{{convertFilesize file.size}} <span>{{file.pretty_type}}</span></a>
				{{{makeFileShareLabel file}}}
				{{#unless standalone}}
					<span class="bullet">•</span>
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">
						{{#if file.comments_count}}{{pluralCount file.comments_count 'comment' 'comments'}}{{else}}Add comment{{/if}}
					</a>
				{{/unless}}
				{{#fileIsImage id=file.id}}
					<span class="bullet">•</span>
					<a href="{{file.url_private}}" target="{{file.url_private}}" data-file-id="{{file.id}}">Open original</a>
				{{/fileIsImage}}				
			</span>
		
			{{#unless standalone}}
				<br />
				{{#if show_initial_comment}}
				{{#if file.initial_comment}}
					<div class="initial_comment">
						<i class="icon_quote float_left ts_icon ts_icon_quote"></i>
						<div class="comment no_bottom_margin">
							{{{formatMessage file.initial_comment.comment}}}
						</div>
						{{{rxnPanel file.initial_comment._rxn_key rxn_options}}}
					</div>
				{{/if}}
				{{/if}}
			{{/unless}}

		{{/isTheme}}		
		
	</div>
</script>
<script id="message_file_snippet_create_old_template" type="text/x-handlebars-template">{{! DEPRECATED_FILE_NOTICE: This file is replaced by file.hbs with the release of feature_fix_files. }}
	<div id="{{makeMsgDomId msg.ts}}" class="message file_reference file_upload {{#if first_in_block}}first{{/if}} {{#if unread}}unread{{/if}} {{#if highlight}}highlight{{/if}} {{#if show_divider}}divider{{/if}} show_user {{#showAvatars}}avatar{{/showAvatars}}" data-ts="{{msg.ts}}">

		{{#unless unprocessed}}
			{{#unless standalone}}
				{{#if show_actions_cog}}
					{{{msgActions msg}}}
				{{/if}}
			{{/unless}}
		{{/unless}}

		{{#showAvatars}}
			{{#if is_file_convo_continuation}}
			{{else}}
				{{{makeMemberPreviewLinkImage member.id 36}}}
			{{/if}}
		{{/showAvatars}}
		
		{{#isTheme theme='dense'}}
			<span class="message_star_holder">{{{star 'file' file null}}}</span>
		
			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}
			<div class="meta">
				<span class="float_left small_right_margin">
					{{{makeMemberPreviewLinkImage file.user 32}}}
				</span>
				<span class="float_left" style="width: 85%">				
					{{{makeMemberPreviewLinkById file.user false}}} created:<br />
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_name bold">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</a>
					<a href="{{file.permalink}}" target="{{file.permalink}}" class="ts_icon ts_icon_external_link icon_new_window" title="Open file page"></a>
				</span>
				<div class="clear_both"></div>				
			</div>
		
			{{#unless standalone}}
				<div class="snippet_preview">
					{{{file.preview_highlight}}}
					{{#if_gt file.lines_more compare=0}}
						<a href="{{file.permalink}}" data-file-id="{{file.id}}" class="file_preview_link snippet_preview_more" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}">+ {{file.lines_more}} more line{{#if_gt file.lines_more compare=1}}s{{/if_gt}}...</a>
					{{/if_gt}}
				</div>

				{{{rxnPanel file._rxn_key rxn_options}}}

				<div class="snippet_meta">
					<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" title="Download this file">{{convertFilesize file.size}} <span>{{file.pretty_type}}</span></a>
					<span class="bullet">•</span> 
					{{#memberIsSelf id=member.id}} 
						{{#unless uploader}}
							<a href="{{file.edit_link}}" target="{{file.id}}" class="file_edit" onclick="TS.ui.snippet_dialog.startEdit('{{file.id}}'); return false">Edit</a> <span class="bullet">•</span>
						{{/unless}}
					{{/memberIsSelf}}
					<a href="{{file.permalink}}" target="{{file.id}}">New window</a>
					<span class="bullet">•</span> 
					<a href="{{file.url_private}}" target="{{file.id}}">View raw</a>
					<span class="bullet">•</span>
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">
						{{#if file.comments_count}}{{pluralCount file.comments_count 'comment' 'comments'}}{{else}}Add comment{{/if}}
					</a>
				</div>

				{{#if show_initial_comment}}
				{{#if file.initial_comment}}
					<p class="small_top_margin no_bottom_margin">{{{formatMessage file.initial_comment.comment}}}</p>
					{{{rxnPanel file.initial_comment._rxn_key rxn_options}}}
				{{/if}}
				{{/if}}
			{{/unless}}
		{{/isTheme}}

		{{#isTheme theme='light'}}
			<a href="/team/{{member.name}}" {{#isClient}}target="/team/{{member.name}}"{{/isClient}} class="member {{getMemberColorClassById member.id}} message_sender" data-member-id="{{member.id}}">{{getMemberDisplayName member}}</a>
			
			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}
			
			<span class="message_star_holder">{{{star 'file' file null}}}</span><br />	
			
			{{#if jump_link}}{{{jump_link}}}{{/if}}
			
			<span class="meta">
				Added {{#if show_initial_comment}}{{#if file.initial_comment}}and commented on{{/if}}{{/if}}
				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file.id}}" class="file_preview_link file_name">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</a>
				{{{makeFileShareLabel file}}}
			</span>
						
			{{#unless standalone}}
				<br />
				<div class="snippet_preview">
					{{{file.preview_highlight}}}
					{{#if_gt file.lines_more compare=0}}
						<a href="{{file.permalink}}" class="file_preview_link snippet_preview_more" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}">+ {{file.lines_more}} more line{{#if_gt file.lines_more compare=1}}s{{/if_gt}}...</a>
					{{/if_gt}}
				</div>

				{{{rxnPanel file._rxn_key rxn_options}}}
			
				<span class="meta block snippet_meta">
					<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" title="Download this file">{{convertFilesize file.size}} <span>{{file.pretty_type}}</span></a>
					<span class="bullet">•</span> 
					{{#memberIsSelf id=member.id}} 
						{{#unless uploader}}
							<a href="{{file.edit_link}}" target="{{file.id}}" class="file_edit" onclick="TS.ui.snippet_dialog.startEdit('{{file.id}}'); return false">Edit</a> <span class="bullet">•</span>
						{{/unless}}
					{{/memberIsSelf}}
					<a href="{{file.permalink}}" target="{{file.id}}">New window</a>
					<span class="bullet">•</span> 
					<a href="{{file.url_private}}" target="{{file.id}}">View raw</a>
					<span class="bullet">•</span>
					<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">
						{{#if file.comments_count}}{{pluralCount file.comments_count 'comment' 'comments'}}{{else}}Add comment{{/if}}
					</a>
				</span>

				{{#if show_initial_comment}}
				{{#if file.initial_comment}}
					<div class="initial_comment">
						<i class="icon_quote float_left ts_icon ts_icon_quote"></i>
						<div class="comment no_bottom_margin">
							{{{formatMessage file.initial_comment.comment}}}
						</div>
						{{{rxnPanel file.initial_comment._rxn_key rxn_options}}}
					</div>
				{{/if}}
				{{/if}}
			{{/unless}}

		{{/isTheme}}		

	</div>
</script>
<script id="message_file_preview_actions_template" type="text/x-handlebars-template"><div class="preview_actions{{#if preview_actions_class}} {{preview_actions_class}}{{/if}}">
	{{#if collapse}}<a class="file_preview_action btn btn_outline preview_show_less_header ts_icon ts_icon_collapse_vertical" title="Collapse"></a>{{/if}}
	{{#if download}}<a class="file_preview_action btn btn_outline file_ssb_download_link ts_icon ts_icon_cloud_download" data-file-id="{{file.id}}" href="{{file.url_private_download}}" target="{{newWindowName}}" title="Download"></a>{{/if}}
	{{#if edit}}<a {{#if_not_equal file.mode compare='snippet'}}href="{{file.permalink}}" target="{{file.permalink}}"{{/if_not_equal}} data-file-id="{{file.id}}" title="Edit" class="file_preview_action btn btn_outline ts_icon ts_icon_pencil file_new_window_link {{#if_equal file.mode compare='snippet'}}snippet_edit_dialog_link{{/if_equal}}"></a>{{/if}}
	{{#if new_window}}
		{{#if file.is_external}}
			<a href="{{fileUrl file}}" target="{{newWindowName}}" data-toggle="tooltip" title="Open file on {{#if_equal file.external_type compare="gdrive"}}Google Drive{{/if_equal}}{{#if_equal file.external_type compare="dropbox"}}Dropbox{{/if_equal}}{{#if_equal file.external_type compare="box"}}Box{{/if_equal}}{{#if_equal file.external_type compare="onedrive"}}OneDrive{{/if_equal}}{{#if_equal file.external_type compare="unknown"}}a web page{{/if_equal}}" class="file_preview_action btn btn_outline ts_icon ts_icon_external_link"></a>
		{{else}}
			{{#fileDefaultIsNewWindow id=file.id}}
				<a class="file_preview_action btn btn_outline ts_icon ts_icon_external_link" href="{{file.url_private}}" target="{{file.id}}" title="Open in new window"></a>
			{{else}}
				<a class="file_preview_action btn btn_outline ts_icon ts_icon_external_link file_new_window_link" data-file-id="{{file.id}}" href="{{file.permalink}}" target="{{file.permalink}}" title="Open in new window"></a>
			{{/fileDefaultIsNewWindow}}
		{{/if}}
	{{/if}}
	<a class="file_preview_action btn btn_outline file_actions ts_icon ts_icon_ellipsis"
		title="More actions"
		data-file-id="{{file.id}}"
		{{#isClient}}data-include-open-flexpane="true"{{/isClient}}
		{{#isWeb}}data-include-open-file-page="true"{{/isWeb}}
		data-include-copy-file-link="true"
		data-exclude-comment="true"
		data-exclude-print="true"
		data-include-view-public-link="true"
		{{#edit}}data-exclude-edit="true"{{/edit}}
		{{#if download}}data-exclude-download="true"{{/if}}
		{{#if_equal main_action compare="download"}}data-exclude-download="true"{{/if_equal}}
		{{#unless open_original}}
			{{#unless file.mode compare="snippet"}}
				{{#if new_window}}data-exclude-original="true"{{/if}}
				{{#if_equal main_action compare="new_window"}}data-exclude-original="true"{{/if_equal}}
			{{/unless}}
		{{/unless}}
	></a>
	<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file.id}}" class="file_preview_action btn btn_outline file_preview_link file_comment_link file_force_flexpane">
		{{#if_equal file.comments_count compare=0}}
			<span>Add Comment</span>
		{{else}}
			{{#if_gt file.comments_count compare=1}}
				<span>{{file.comments_count}} Comments</span>
			{{else}}
				<span>{{file.comments_count}} Comment</span>
			{{/if_gt}}
		{{/if_equal}}
	</a>
</div>
</script>
<script id="message_file_preview_footer_template" type="text/x-handlebars-template">{{#if collapse}}
	<div class="preview_show preview_show_more">
		<div class="preview_show_center">
			<button class="preview_show_btn" data-file-id="{{file.id}}">
				<i class="ts_icon ts_icon_plus_small"></i>Click to expand inline
				{{#if file.lines}}<span class="line_count">{{file.lines}} line{{#if_gt file.lines compare=1}}s{{/if_gt}}</span>{{/if}}
			</button>
		</div>
	</div>
	<div class="preview_show preview_show_less">
		<button class="preview_show_btn">Collapse<i class="ts_icon ts_icon_arrow_up_medium"></i></button>
	</div>
{{/if}}
</script>
	<script id="message_template" type="text/x-handlebars-template">{{! DEPRECATED_FILE_NOTICE: This file is replaced by message.hbs with the release of feature_new_message_markup. }}
{{#if minimal_view}}
	
	<div id="{{makeMsgDomId msg.ts}}" class="minimal {{#if msg.no_display}}hidden{{/if}} message {{makeMsgSubtypeDomClass msg}} {{#if show_user}}show_user{{/if}} {{#if is_ephemeral}}ephemeral{{/if}} {{#showAvatars}}avatar{{/showAvatars}} {{#if first_in_block}}first{{/if}} {{#if unread}}unread{{/if}} {{#if unprocessed}}unprocessed{{/if}} {{#if highlight}}highlight{{/if}} {{#if show_divider}}divider{{/if}}" data-ts="{{msg.ts}}">
	<div style="margin-left:-30px; font-size:.6rem">Hidden message from 
	{{#if member}}
		<a href="/team/{{member.name}}" {{#isClient}}target="/team/{{member.name}}"{{/isClient}} class="message_sender member {{getMemberColorClassById member.id}}" data-member-id="{{member.id}}"> {{getMemberDisplayName member}}</a>{{#if is_bot}}<span class="bot_label">BOT</span>{{/if}}
	{{else}}
		<span class="message_sender {{getBotColorClassByUserName msg.username}}"> {{#showAvatars}}{{{getBotNameWithLink msg}}}{{else}}{{{getBotNameAndIcon msg}}}{{/showAvatars}}</span>{{#if is_bot}}<span class="bot_label">BOT</span>{{/if}}</i>
	{{/if}}
	
	</div>
	
{{else}}

	{{#if starred_items_actions}}{{else}}
		{{#if starred_items_list}}
			{{{star 'message' msg model_ob}}}
		{{/if}}
	{{/if}}

	<div id="{{makeMsgDomId msg.ts}}" class="{{#if msg.no_display}}hidden{{/if}} message {{makeMsgSubtypeDomClass msg}} {{#if show_user}}show_user{{/if}} {{#if is_ephemeral}}ephemeral{{/if}} {{#showAvatars}}avatar{{/showAvatars}} {{#if first_in_block}}first{{/if}} {{#if unread}}unread{{/if}} {{#if unprocessed}}unprocessed{{/if}} {{#if highlight}}highlight{{/if}} {{#if show_divider}}divider{{/if}}" data-ts="{{msg.ts}}" aria-labelledby="{{makeMsgLabelDomId msg.ts}}">
		{{#unless unprocessed}}
			{{#unless standalone}}

				{{#if show_actions_cog}}
					{{{msgActions msg}}}
				{{/if}}

				{{#unless starred_items_list}}							
					{{#if_equal theme compare='dense'}}
						{{#unless is_ephemeral}}
							<span class="message_star_holder">{{{star 'message' msg model_ob}}}</span>
						{{/unless}}
					{{/if_equal}}

					{{#if_equal theme compare='light'}}
						{{#unless show_user}}
							{{#unless is_ephemeral}}
								<span class="message_star_holder">{{{star 'message' msg model_ob}}}</span>
							{{/unless}}
						{{/unless}}
					{{/if_equal}}
				{{/unless}}

			{{/unless}}
		{{/unless}}
		
		{{#if_equal theme compare='light'}}
			{{#if show_user}}
				{{#if member}}
					{{{makeMemberPreviewLinkImage member.id 36}}}
				{{else}}
					{{{makeUsernameImage msg 36}}}
				{{/if}}
			{{/if}}
		{{/if_equal}}
		
	{{! DENSE ------------------------------------------------ }}
		{{#if_equal theme compare='dense'}}
			{{#if permalink}}
				<i class="copy_only"><br>[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp {{#if show_user}}{{else}}no_user{{/if}}">{{#if full_date}}{{toCalendarDateOrNamedDayShort msg.ts}} at {{/if}}{{toTime msg.ts}}</a><i class="copy_only">]</i>
			{{else}}
				<i class="copy_only"><br>[</i><span title="{{{msgTsTitle msg}}}" class="timestamp {{#if show_user}}{{else}}no_user{{/if}}">{{#if full_date}}{{toCalendarDateOrNamedDayShort msg.ts}} at {{/if}}{{toTime msg.ts}}</span><i class="copy_only">]</i>
			{{/if}}
		{{/if_equal}}
	{{! /DENSE ------------------------------------------------ }}
	
	{{! LIGHT ------------------------------------------------ }}
		{{#if_equal theme compare='light'}}
			<i class="copy_only"><br></i>
		{{/if_equal}}
	{{! /LIGHT ------------------------------------------------ }}

		{{! NOTE: the spaces at the start of the below elements are important for copied text formatting (and they should not affect html rendering)}}
		{{#unless show_user}}<i class="copy_only">{{/unless}}
		{{#if member}}
			<a href="/team/{{member.name}}" {{#isClient}}target="/team/{{member.name}}"{{/isClient}} class="message_sender member {{getMemberColorClassById member.id}}" data-member-id="{{member.id}}"> {{getMemberDisplayName member}}</a>{{#if is_bot}}<span class="bot_label">BOT</span>{{/if}}<i class="copy_only">{{#if_equal theme compare='dense'}}:{{/if_equal}}</i>
		{{else}}
			{{#feature flag="feature_bot_profile"}}
				<a href="/service/{{msg.bot_id}}" class="message_sender service" data-service-id="{{msg.bot_id}}">{{ getBotName msg }}</a>
			{{else}}
				<span class="message_sender {{getBotColorClassByUserName msg.username}}"> {{#showAvatars}}{{{getBotNameWithLink msg}}}{{else}}{{{getBotNameAndIcon msg}}}{{/showAvatars}}</span>{{#if is_bot}}<span class="bot_label">BOT</span>{{/if}}<i class="copy_only">{{#if_equal theme compare='dense'}}:{{/if_equal}}</i>
			{{/feature}}
		{{/if}}
		{{#unless show_user}}</i>{{/unless}}

	{{! LIGHT ------------------------------------------------ }}
		{{#if_equal theme compare='light'}}
			{{#if show_user}}
				{{#if permalink}}
					<i class="copy_only">[</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp{{#if full_date}} no_wrap{{/if}}">{{#if full_date}}{{toCalendarDateOrNamedDayShort msg.ts}} at {{/if}}{{toTime msg.ts}}</a><i class="copy_only">]</i>
				{{else}}
					<i class="copy_only">[</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{#if full_date}}{{toCalendarDateOrNamedDayShort msg.ts}} at {{/if}}{{toTime msg.ts}}</span><i class="copy_only">]</i>
				{{/if}}

				{{#unless starred_items_list}}	
					{{#unless is_ephemeral}}
						<span class="message_star_holder">{{{star 'message' msg model_ob}}}</span>				
					{{/unless}}
				{{/unless}}

				{{#if is_ephemeral}}<span class="ephemeral_notice small_left_margin">Only you can see this message</span>{{/if}}
			{{else}}
				{{#if permalink}}
					<i class="copy_only">[{{#if full_date}}{{toCalendarDateOrNamedDayShort msg.ts}} at {{/if}}{{toTime msg.ts}}]</i><a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{#if full_date}}{{toCalendarDateOrNamedDayShort msg.ts}} at {{/if}}{{toTime msg.ts false}}</a>
				{{else}}
					<i class="copy_only">[{{#if full_date}}{{toCalendarDateOrNamedDayShort msg.ts}} at {{/if}}{{toTime msg.ts}}]</i><span title="{{{msgTsTitle msg}}}" class="timestamp">{{#if full_date}}{{toCalendarDateOrNamedDayShort msg.ts}} at {{/if}}{{toTime msg.ts false}}</span>
				{{/if}}
			{{/if}}

			{{#if starred_items_actions}}
				<div class="actions">
					{{{jump_link}}}
					<button class="file_star btn_icon btn btn_outline ts_tip_btn ts_tip ts_tip_top">
						{{{star 'message' msg model_ob}}}
						<div class="star_message ts_tip_tip">Star</div>
						<div class="unstar_message ts_tip_tip">Unstar</div>
					</button>
				</div>
			{{else}}
				{{#if jump_link}}{{{jump_link}}}{{/if}}
			{{/if}}
		{{/if_equal}}
	{{! /LIGHT ------------------------------------------------ }}
	
		<span class="message_content">
			{{{formatMessageByType msg do_inline_imgs enable_slack_action_links model_ob}}}
			{{#unless no_attachments}}{{{formatAttachments msg enable_slack_action_links}}}{{/unless}}
			{{#if msg.edited}}
				<span class="edited" data-toggle="tooltip" title="{{toCalendarDateOrNamedDayShort msg.edited.ts}} at {{toTime msg.edited.ts true true}}">(edited)</span>
			{{/if}}
		</span>
		{{#unless is_ephemeral}}{{{rxnPanel msg._rxn_key rxn_options}}}{{/unless}}

		<span id="{{makeMsgLabelDomId msg.ts}}" class="message_aria_label hidden">
			<strong>{{#if member}}{{getMemberDisplayName member}}{{else}}{{{getBotNameWithLink msg}}}{{/if}}</strong>.
			{{{formatMessageByType msg false false model_ob}}}.
			{{toTimeWords msg.ts}}.{{#if msg.edited}} Edited.{{/if}}{{#if msg.is_starred}} Starred.{{/if}}{{#if is_ephemeral}} Only you can see this message.{{/if}}	
		</span>
		
	{{! DENSE ------------------------------------------------ }}
		{{#if_equal theme compare='dense'}}
			{{#if show_user}}
				{{#if is_ephemeral}}<span class="ephemeral_notice">Only you can see this message</span>{{/if}}		
			{{/if}}
		{{/if_equal}}
	{{! /DENSE ------------------------------------------------ }}
		
		{{#if unprocessed}}
			<span class="temp_msg_controls {{#unless show_resend_controls}}hidden{{/unless}}">(this message send failed, would you like to <nobr><a class="resend_temp_msg">resend</a> • <a class="remove_temp_msg">remove</a>?)</nobr></span>
		{{/if}}
{{/if}}
	</div>
</script>
<script id="message_edit_form_template" type="text/x-handlebars-template">{{#feature flag="feature_new_message_markup"}}
	<ts-message id="message_edit_container" class="message first highlight">
		<div class="message_gutter">
			<div class="message_icon">
				{{#if msg.user}}
					{{{makeMemberPreviewLinkImage msg.user 36}}}
				{{else}}
					{{{makeUsernameImage msg 36}}}
				{{/if}}
			</div>
			{{!-- <i class="copy_only">[</i> --}}<{{#if permalink}}a href="{{permalink}}" target="{{newWindowName}}"{{else}}span{{/if}} title="{{{msgTsTitle msg}}}" class="timestamp{{#if full_date}} no_wrap{{/if}}">{{#if full_date}}{{toCalendarDateOrNamedDayShort msg.ts}} at {{/if}}{{{toTime msg.ts}}}</{{#if permalink}}a{{else}}span{{/if}}>{{!-- <i class="copy_only">[</i> --}}
			{{#if show_star}}<span class="message_star_holder">{{{star 'message' msg model_ob}}}</span>{{/if}}
		</div>
		<form id="message_edit_form" data-msg-ts="{{msg.ts}}">
			{{#if include_emo}}<a class="emo_menu hidden"><i class="ts_icon ts_icon_circle_fill"></i><i class="ts_icon ts_icon_smile_o"></i><i class="ts_icon ts_icon_happy_smile"></i></a>{{/if}}
			<textarea id="msg_text" name="msg_text">{{edit_text}}</textarea>
			<a id="cancel_edit" role="button" class="btn btn_small btn_outline">Cancel</a>
			<a id="commit_edit" role="button" class="btn btn_small"><i class="ts_icon ts_icon_enter ts_icon_inherit small_right_margin"></i>Save Changes</a>
			<span id="message_editing_info" class="mini" style="display: none;">Finish editing this message first! Or press <strong>escape</strong> if you've changed your mind.</span>
			<span class="mini float_right" id="edit_controls"><span id="edit_countdown"></span>
			<span class="candy_red" id="edit_warning" class="hidden">text is too long!</span></span>
		</form>
	</ts-message>
{{else}}
<div id="message_edit_container" class="message highlight {{#if first_in_block}}first{{/if}}">
	{{#isTheme theme="dense"}}
		<a href="{{permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle msg}}}" class="timestamp">{{toTime msg.ts}}</a>
	{{/isTheme}}
	{{#isTheme theme="light"}}
		{{#if msg.user}}
			{{{makeMemberPreviewLinkImage msg.user 36}}}
		{{/if}}
	{{/isTheme}}
	<p id="message_editing_info" class="mini" style="display: none;">
		Finish editing this message first! Or press <strong>escape</strong> if you've changed your mind.
	</p>
	<form id="message_edit_form" data-msg-ts="{{msg.ts}}">
		{{#if include_emo}}<a class="emo_menu hidden"><i class="ts_icon ts_icon_circle_fill"></i><i class="ts_icon ts_icon_smile_o"></i><i class="ts_icon ts_icon_happy_smile"></i></a>{{/if}}
		<textarea id="msg_text" name="msg_text">{{edit_text}}</textarea><br />
		<span class="mini">esc to <a id="cancel_edit">cancel</a></span>
		<span class="mini float_right" id="edit_controls"><span id="edit_countdown"></span> <span id="edit_saver">enter to <a id="commit_edit">save changes</a></span><span class="candy_red" id="edit_warning" class="hidden">text is too long!</span></span>
	</form>
</div>
{{/feature}}
</script>
<script id="message_inline_video_template" type="text/x-handlebars-template">{{!-- Video attachments as shown in messages; YouTube, Vimeo et al. --}}
<div data-real-src="{{inline_video.real_src}}" class="clear_both msg_inline_video_holder msg_inline_holder{{#unless inline_video.expand_it}} hidden{{/unless}}" style="width:{{inline_video.display_w}}px;height:{{inline_video.display_h}}px;max-width:100%">
	<div class="msg_inline_video_iframe_div hidden" data-url="{{inline_video.data_url}}"></div>
	<div class="msg_inline_video_thumb_div">
		<div class="msg_inline_video_buttons_div">
		{{#if inline_video.show_play}}
			<div class="button_left">
				<button class="msg_inline_video_play_button" title="Play video in Slack" aria-label="Play video in Slack"><i class="ts_icon ts_icon_play ts_icon_inherit"></i></button>
			</div>
			<div class="button_right">
				<a {{{inline_video.referrer_safe_url_attributes}}} class="msg_inline_video_new_window_button" target="_blank" title="Open video in new tab" aria-label="Open video in new tab"><i class="ts_icon ts_icon_external_link ts_icon_inherit"></i></a>
			</div>
		{{else}}
			<a {{{inline_video.referrer_safe_url_attributes}}} class="msg_inline_video_new_window_button" target="_blank" title="Open video in new tab" aria-label="Open video in new tab"><i class="ts_icon ts_icon_external_link ts_icon_inherit"></i></a>
		{{/if}}
		</div>
		<img class="msg_inline_video msg_inline_child{{#if inline_video.hide_by_default}} hidden{{/if}}" {{#if inline_video.hide_by_default}}data-real-src{{else}}src{{/if}}="{{inline_video.proxied_src_or_src}}" style="width:{{inline_video.display_w}}px;height:{{inline_video.display_h}}px" />
	</div>
</div></script>
<script id="attachment_inline_audio_toggler_template" type="text/x-handlebars-template"><i data-real-src="{{inline_audio.src}}" class="msg_inline_audio_collapser ts_icon ts_icon_caret_down{{#unless inline_audio.expand_it}} hidden{{/unless}}"></i>
<i data-real-src="{{inline_audio.src}}" class="msg_inline_audio_expander ts_icon ts_icon_caret_right{{#if inline_audio.expand_it}} hidden{{/if}}"></i>
</script>
<script id="attachment_inline_video_toggler_template" type="text/x-handlebars-template">{{#unless inline_video.no_title}}
	{{inline_video.title}} 
{{/unless}}
<i data-real-src="{{inline_video.src}}" class="msg_inline_video_collapser ts_icon ts_icon_caret_down{{#unless inline_video.expand_it}} hidden{{/unless}}"></i>
<i data-real-src="{{inline_video.src}}" class="msg_inline_video_expander ts_icon ts_icon_caret_right{{#if inline_video.expand_it}} hidden{{/if}}"></i></script>
<script id="attachment_inline_audio_div_template" type="text/x-handlebars-template"><div data-real-src="{{inline_audio.src}}" class="clear_both msg_inline_audio_holder msg_inline_holder{{#unless inline_audio.expand_it}} hidden{{/unless}}">
	{{!-- unescaped iframe + related HTML for Spotify, Rdio, Bandcamp and the like. --}}
	{{{inline_audio.content}}}
</div>
</script>
<script id="inline_attachment_toggler_template" type="text/x-handlebars-template"><i data-real-src="{{inline_attachment.real_src}}" class="msg_inline_attachment_collapser ts_icon ts_icon_caret_down{{#unless inline_attachment.expand_it}} hidden{{/unless}}"></i>
<i data-real-src="{{inline_attachment.real_src}}" class="msg_inline_attachment_expander ts_icon ts_icon_caret_right{{#if inline_attachment.expand_it}} hidden{{/if}}"></i>
</script>
<script id="inline_other_toggler_template" type="text/x-handlebars-template"><i data-real-src="{{inline_other.src}}" class="msg_inline_other_collapser ts_icon ts_icon_caret_down{{#unless inline_other.expand_it}} hidden{{/unless}}"></i>
<i data-real-src="{{inline_other.src}}" class="msg_inline_other_expander ts_icon ts_icon_caret_right{{#if inline_other.expand_it}} hidden{{/if}}"></i>
</script>

<script id="service_preview_header_template" type="text/x-handlebars-template"><div class="profile_preview_header">
	<div class="row profile_preview_avatar_title">
		<div class="profile_preview_avatar col">
			<img src="{{ avatar }}" alt="{{ name }}" />
		</div>
		<div class="profile_preview_title col">
			<h3 class="profile_name">{{ name }}</h3>
			<p class="profile_type">{{ integration_type }}</p>
		</div>
	</div>
	<div class="row profile_preview_details">
		<div class="col span_1_of_1">
			{{#if details}}
				<p>{{ details }}</p>
			{{/if}}
			{{#if added_by}}
				<p>Added By <a href="/team/{{ added_by }}" target="_blank">{{ added_by }}</a></p>
			{{/if}}
			{{#if label}}
				<p><i>{{ label }} </i></p>
			{{/if}}
		</div>
	</div>
</div>
</script>
<script id="service_preview_body_template" type="text/x-handlebars-template"><li role="menuitem">
	<a href="/services/{{ id }}" target="_blank">Integration Settings</a>
</li>
{{#if files}}
	<li role="menuitem">
		<a href="/services/{{ id }}" target="_blank">View Files</a>
	</li>
{{/if}}
</script>

<script id="messages_unread_divider_template" type="text/x-handlebars-template"><div id="msgs_unread_divider" class="unread_divider">
	<hr role="separator" aria-hidden="true" />
	<span class="divider_label">NEW MESSAGES</span>
</div></script>
<script id="message_pinned_file_template" type="text/x-handlebars-template">	<span class="pinned_item_message_header">
		{{#if_equal theme compare='light'}}
			<i class="ts_icon ts_icon_thumb_tack"></i> Pinned
		{{else}}
			pinned
		{{/if_equal}}
		{{#if own_file}}
			their {{{pinnedFileType file}}}{{#unless file}}.{{/unless}}
		{{else}}
			{{#if uploader}}{{{makeMemberPreviewLinkById uploader.id false}}}{{possessive display_name}}{{else}}a{{/if}} {{pinnedFileType file}}{{#unless file}}.{{/unless}}
		{{/if}}
		{{#if file}}
			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_name">{{#if file.title}}{{{formatFileTitle file}}}{{else}}{{file.name}}{{/if}}</a>.
		{{/if}}
		{{#isClient}}<a class="see_all_pins">See all pinned items in this {{#if model_ob.is_channel}}channel{{else}}{{groupCopy skip_private=true}}{{/if}}.</a>{{/isClient}}
	</span>

</script>
<script id="message_pinned_message_template" type="text/x-handlebars-template">	<span class="pinned_item_message_header">
		{{#if_equal theme compare='light'}}
			<i class="ts_icon ts_icon_thumb_tack"></i> Pinned a message.
		{{else}}
			pinned a message.
		{{/if_equal}}
		{{#isClient}}<a class="see_all_pins">See all pinned items in this {{#if model_ob.is_channel}}channel{{else}}{{groupCopy skip_private=true}}{{/if}}.</a>{{/isClient}}
	</span>

</script>
<script id="message_pinned_comment_template" type="text/x-handlebars-template">	<span class="pinned_item_message_header">
		{{#if_equal theme compare='light'}}
			<i class="ts_icon ts_icon_thumb_tack"></i> Pinned a comment.
		{{else}}
			pinned a comment.
		{{/if_equal}}
		{{#isClient}}<a class="see_all_pins">See all pinned items in this {{#if model_ob.is_channel}}channel{{else}}{{groupCopy skip_private=true}}{{/if}}.</a>{{/isClient}}
	</span>

</script>

<script id="search_tabs_template" type="text/x-handlebars-template">	<div id="search_filters" class="{{searchFilter}}">
		<a id="filter_messages" onclick="TS.search.setFilter('messages'); return false;">Messages ({{messages_count}})</a>
		<a id="filter_files" onclick="TS.search.setFilter('files'); return false;">Files ({{files_count}})</a>
	</div>
		
</script>
<script id="search_files_heading_template" type="text/x-handlebars-template">	<a id="search_file_list_clear_filter" class="menu_icon {{#if_equal filetype compare="all"}}hidden{{/if_equal}}"><i class="ts_icon ts_icon_times_circle"></i></a>
	<a id="search_file_list_heading">
		<span class="heading_label">{{filetype_label}}</span> <i class="ts_icon ts_icon_caret_down"></i>
	</a>
</script>
<script id="search_team_results_template" type="text/x-handlebars-template">	<p class="team_results_heading">We found <strong>{{matches.length}} team {{pluralize matches.length "member" "members"}}</strong> matching your query:</p>
	<div id="team_results_container">
	{{#each matches}}
		<p class="team_result">
			{{{makeMemberPreviewLinkImage this.id 32}}}
			<a href="/team/{{this.name}}" {{#isClient}}target="/team/{{this.name}}"{{/isClient}} class="black member_preview_link member_name" data-member-id="{{this.id}}">{{this.name}}</a> <span class="{{makeMemberPresenceDomClass this}}">{{{makeMemberPresenceIcon this}}}</span> {{#if this.profile.real_name}}<span class="indifferent_grey bold">{{this.profile.real_name}}</span>{{/if}}<br/>
			
			{{#if this.profile.title}}<span>{{this.profile.title}}</span> <span class="bullet">•</span>{{/if}}
			{{#memberIsSelf id=this.id}}
				<a href="/team/{{this.name}}" {{#isClient}}target="/team/{{this.name}}"{{/isClient}} class="member_preview_link" data-member-id="{{this.id}}">View Profile</a>
			{{else}}
				<a href="/messages/@{{this.name}}" {{#isClient}}target="/messages/@{{this.name}}"{{/isClient}} class="internal_im_link {{#isClient}}team_list_dm_link{{/isClient}}" data-member-name="{{this.name}}">Send direct message</a>
			{{/memberIsSelf}}
		</p>
	{{/each}}
	</div>
</script>
<script id="search_options_template" type="text/x-handlebars-template">	<div id="advanced_options">
	
		<p>
			<span id="search_filter_menu_label" class="cursor_pointer display_flex align_items_baseline {{#if menu_is_showing}}active{{/if}}">
				<span class="search_filter_menu_target tiny_right_margin bold">Include:</span>
				<span class="flex_one search_filter_menu_target tiny_left_margin search_filter_text">{{include_text}} <i class="ts_icon ts_icon_chevron_down bold arrow_down tiny_left_margin"></i></span>
			</span>
		</p>

	</div>
		
</script>
<script id="search_results_none_template" type="text/x-handlebars-template">	<p class="no_results">
		No 
		{{#if_equal filter compare='files'}}
			{{#if_equal filetype compare="all"}}
				files
			{{else}}
				{{filetype_label}}
			{{/if_equal}}
		{{else}}
			{{filter}} 
		{{/if_equal}}
		found matching:<br><strong>{{query_string}}</strong>.
	</p>

	{{#if error}}
		<p class="alert alert_info">
			<i class="ts_icon ts_icon_warning"></i> <strong>Our sincere apologies!</strong><br />
			{{#if_equal error compare="temporarily_disabled"}}
				Search has been temporarily disabled while we deal with some issues. You can check <a href="http://status.slack.com" class="bold underline" target="{{newWindowName}}">our status site</a> for updates if it does not become available shortly.
			{{else}}
				Search failed with an error. This incident has been logged and is being investigated. You can check <a href="http://status.slack.com" class="bold underline" target="{{newWindowName}}">our status site</a> for updates if this problem persists.
				<span class="subtle_silver">(error: "{{error}}")</span>
			{{/if_equal}}
		</p>	
	{{/if}}

</script>
<script id="search_message_results_template" type="text/x-handlebars-template"><div id="search_message_results">
	{{#if page}}
		{{#each page}}
			{{> search_message_results_item}}
		{{/each}}
		{{{paging_html}}}
	{{else}}
		<div class="loading_hash_animation"><img src="{{versioned_loading_hash_animation}}" alt="Loading" /><br />loading page {{current_page}}...</div>
	{{/if}}
</div>
</script>
<script id="search_message_results_item_template" type="text/x-handlebars-template">	<div class="search_message_result null_transform {{#ifExtracts this}}{{else}}extracts_expanded no_extracts{{/ifExtracts}}" id="{{makeMSRDomId this}}" data-channel="{{this.channel.id}}" data-ts="{{this.ts}}">
		<div class="search_message_result_meta {{#feature flag="feature_mpim_client"}}display_flex black indifferent_grey{{/feature}}">
			<strong {{#feature flag="feature_mpim_client"}}class="overflow_ellipsis small_right_margin"{{/feature}}>
				{{#if_equal this.type compare='im'}}
					{{{makeIMLinkById this.channel.id}}}
				{{else}}
					{{#if_equal this.type compare='group'}}
						{{#feature flag="feature_mpim_client"}}
							{{#if this.channel.is_mpim}}
								{{{makeMpimLink this.channel true}}}
							{{else}}
								{{{makeGroupLink this.channel}}}
							{{/if}}
						{{else}}
							{{{makeGroupLink this.channel}}}
						{{/feature}}
					{{else}}
						{{{makeChannelLink this.channel}}}
					{{/if_equal}}
				{{/if_equal}}
			</strong>
			<div class="date_links {{#feature flag="feature_mpim_client"}}flex_none auto_left_margin normal{{/feature}}">
				{{#isUsingArchiveViewer}}
					<a href="{{this.permalink}}" target="{{newWindowName}}" class="search_jump">Jump</a> • 
				{{else}}
					{{#if_equal this.type compare='im'}}
						{{#if this.is_loaded}}
							<a href="{{this.permalink}}" target="{{newWindowName}}" class="search_jump">Jump</a> • 
						{{/if}}
					{{else}}
						{{#if_equal this.type compare='group'}}
							{{#if this.is_loaded}}
								<a href="{{this.permalink}}" target="{{newWindowName}}" class="search_jump">Jump</a> • 
							{{/if}}
						{{else}}
							{{#if this.channel.is_member}}
								{{#if this.is_loaded}}
									<a href="{{this.permalink}}" target="{{newWindowName}}" class="search_jump">Jump</a> • 
								{{/if}}
							{{/if}}
						{{/if_equal}}
					{{/if_equal}}
				{{/isUsingArchiveViewer}}
				{{! class="search_jump_maybe" makes these date link cmd/ctrl clickable to do the deep history searching in client}}
				
				<a href="{{this.permalink}}" target="{{newWindowName}}" title="{{{msgTsTitle this}}}">{{toCalendarDateOrNamedDayShort this.ts}}</a>
			</div>
		</div>
		<div class="search_message_result_text {{#willForceExtracts this}}extracts_forced{{/willForceExtracts}}">
			{{{buildMsgHTMLForSearch this}}}
		</div>
	</div>
</script>
<script id="search_attachment_extracts_template" type="text/x-handlebars-template">	<div class="attachment_extract">
		<div class="attachment_stripe" style="background-color: #{{bg_color}}"></div>
		<div>
			{{#if attachment.author_name}}
				<div>
					{{#if attachment.author_icon}}
						<img class="small_right_margin author_icon" src="{{attachment.author_icon}}">
					{{/if}}
					
					<span class="bold">{{{highlightSearchMatches attachment.author_name}}}</span>
					
					{{#if attachment.author_subname}}
						<span class="small_left_margin subtle_silver">{{{highlightSearchMatches attachment.author_subname}}}</span>
					{{/if}}
				</div>
			{{else}}
				{{#if attachment.service_name}}
					<div class="subtle_silver">{{{highlightSearchMatches attachment.service_name}}}</div>
				{{/if}}
			{{/if}}
			<span>{{{concatAttachmentExtracts attachment message}}}</span>
		</div>
	</div>
</script>
<script id="search_message_extracts_template" type="text/x-handlebars-template">	<span class="{{#feature flag="feature_new_message_markup"}}message_body{{else}}message_content{{/feature}} extract_content">
		{{{concatMsgExtracts message}}}
		{{#each message.attachments}}
			{{{formatAttachmentExtracts this message}}}
		{{/each}}
	</span>
</script>
<script id="search_autocomplete_menu_template" type="text/x-handlebars-template">{{#if header}}{{#with header}}
  <header>
    {{#if contextual_message}}
      {{{contextual_message}}}
    {{/if}}
  </header>
{{/with}}{{/if}}

{{#if modifiers}}
  <div class="section_header"><hr><span class="header_label search_mini">Modifiers</span></div>
  <ol class="results modifiers">
    {{#each modifiers}}
      <li data-replacement="{{modifier}}{{matching_keyword}}"{{#if matching_keyword}}class="keyword_match" data-matching-keyword="{{matching_keyword}}"{{/if}}>
        <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i><span class="modifier">{{modifier}}</span>{{#if matching_keyword}}<span class="keyword">{{matching_keyword}}</span>{{else}}{{#if keyword_placeholder}} <span class="keyword_placeholder">{{keyword_placeholder}}</span>{{/if}}{{/if}}
      </li>
    {{/each}}
  </ol>
{{/if}}

{{#if modifier_groups}}
  <div class="section_header"><hr><span class="header_label search_mini">Conversation</span></div>
  <ol class="results modifiers">
    <li data-replacement="from:">
        <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>from: <span class="keyword_placeholder">team member</span></li>
    <li data-replacement="to:">
        <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>to: <span class="keyword_placeholder">a {{channelGroupOrDirectMessageCopy}}</span></li>
    <li data-replacement="in:">
        <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>in: <span class="keyword_placeholder">a {{channelGroupOrDirectMessageCopy}}</span></li>
  </ol>
  <div class="section_header"><hr><span class="header_label search_mini">Time</span></div>
  <ol class="results modifiers">
    <li data-replacement="after:">
        <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>after: <span class="keyword_placeholder">a date</span></li>
    <li data-replacement="before:">
        <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>before: <span class="keyword_placeholder">a date</span></li>
    <li data-replacement="on:">
        <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>on: <span class="keyword_placeholder">a date</span></li>
    <li data-replacement="during:">
        <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>during: <span class="keyword_placeholder">a month or year</span></li>
  </ol>
  <div class="section_header"><hr><span class="header_label search_mini">Properties</span></div>
  <ol class="results modifiers">
    <li data-replacement="has:">
      <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>has: <span class="keyword_placeholder">star or link</span>
    </li>
  </ol>
{{/if}}

{{#if special}}
  {{#if special_section_header}}<div class="section_header"><hr><span class="header_label search_mini">{{special_section_header}}</span></div>{{/if}}
  <ol class="results special">
    {{#each special}}
      {{#if is_channel}}
        <li data-replacement="{{../../conversation_modifier}}#{{name}}">
          <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>{{#if ../../show_modifier}}<span class="normal">{{../../../conversation_modifier}}</span>{{/if}}#{{name}}
        </li>
      {{else}}
        {{#if is_group}}
          <li data-replacement="{{../../../conversation_modifier}}{{name}}">
            <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>{{#if ../../../show_modifier}}<span class="normal">{{../../../../conversation_modifier}}</span>{{/if}}{{name}}
          </li>
        {{else}}
          <li data-replacement="{{../../../conversation_modifier}}@{{name}}">
            <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>{{#if ../../../show_modifier}}<span class="normal">{{../../../../conversation_modifier}}</span>{{/if}}{{#if real_name}}{{real_name}} {{/if}}<span class="{{#if real_name}}username{{/if}}">@{{name}}</span>
          </li>
        {{/if}}
      {{/if}}
    {{/each}}
  </ol>
{{/if}}

{{#if users}}
  <div class="section_header"><hr><span class="header_label search_mini">Team members</span></div>
  <ol class="results users">
    {{#each users}}
      <li data-replacement="from:@{{name}}">
        <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>{{#if ../show_modifier}}<span class="normal">from:</span>{{/if}}{{#if real_name}}{{real_name}} {{/if}}<span class="{{#if real_name}}username{{/if}}">@{{name}}</span>
      </li>
    {{/each}}

    {{#if ../users_deleted}}
      <li class="reveal_hidden_items"><div class="assistive_search_icon ellipsis_icon"></div><div class="assistive_search_icon down_caret_icon float_right"></div><span class="search_light_grey">Show {{users_deleted.length}} disabled {{pluralize users_deleted.length "account"}}</span></li>
      {{#each ../users_deleted}}
        <li data-replacement="from:@{{name}}" class="hidden">
          <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>{{#if ../../show_modifier}}<span class="normal">from:</span>{{/if}}{{#if real_name}}{{real_name}} {{/if}}<span class="{{#if real_name}}username{{/if}}">@{{name}}</span>
        </li>
      {{/each}}
    {{/if}}
  </ol>
{{/if}}

{{{conversations_html}}}

{{#if bots}}
  <div class="section_header"><hr><span class="header_label search_mini">Integrations</span></div>
  <ol class="results bots">
    {{#each bots}}
      <li data-replacement="{{../bot_modifier}}{{name}}">
        <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>{{#if ../show_modifier}}<span class="normal">{{../../bot_modifier}}</span>{{/if}}{{name}}
      </li>
    {{/each}}
  </ol>
{{/if}}

{{#if has}}
  <div class="section_header"><hr><span class="header_label search_mini">Properties</span></div>
  <ol class="results has">
    {{#each has}}
      <li data-replacement="has:{{name}}">
        <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>{{#if ../show_modifier}}<span class="normal">has:</span>{{/if}}{{name}}
      </li>
    {{/each}}
  </ol>
{{/if}}

{{#if profiles}}
  <div class="section_header"><hr><span class="header_label search_mini">Profiles</span></div>
  <ol class="results profiles">
    {{#each profiles}}
      <li data-member-id="{{this.id}}" class="clear_both">
        <i class="ts_icon ts_icon_chevron_medium_right float_right plastic_grey"></i>
        <div class="float_left small_right_margin">{{{makeMemberPreviewLinkImage this.id 32 false true}}}</div>
        <div class="search_mini overflow_ellipsis"><span class="black profile_username">{{name}}</span> <span class="search_mini normal {{makeMemberPresenceDomClass this}}">{{{makeMemberPresenceIcon this}}}</span> <span class="search_mini">{{#if real_name}}{{real_name}}{{/if}}</span></div>
        <div class="search_mini overflow_ellipsis search_light_grey profile_title">{{#if this.profile.title}}{{this.profile.title}}{{/if}}</div>
      </li>
    {{/each}}
  </ol>
{{/if}}

{{#if history}}
  <div class="section_header"><hr><span class="header_label search_mini">History</span></div>
  <ol class="results history">
    {{#each history}}
      <li data-replacement="{{text}}"><i class="ts_icon ts_icon_clock_o ts_icon_inherit history_icon"></i><span class="history_query">{{{html}}}</span> <div class="delete_history_item_target_area"><i class="ts_icon ts_icon_times ts_icon_inherit delete_icon"></i></div></li>
    {{/each}}
  </ol>
{{/if}}

{{#if noResults}}
  <p class="no_results">
    No suggestions.
  </p>
{{/if}}

{{#if footer}}{{#with footer}}
  <footer {{#if contextual_message}}class="contextual_message"{{/if}}>
    {{#if contextual_message}}
      {{{contextual_message}}}
    {{else}}
      {{#if tips}}
        <div class="black small_bottom_margin tips_header">Assisted Search</div>
        <div>Narrow your search with <span class="modifier closed footer_tip_action" data-replacement="before:">before:</span>, <span class="modifier closed footer_tip_action" data-replacement="from:">from:</span>, or <span class="modifier closed footer_tip_action" data-replacement="in:">in:</span>. Or press the plus key <span class="boxed tight footer_tip_action" data-replacement="+">+</span> to see more modifiers.</div>
      {{else}}
        Type <strong>+</strong> to see the full list of modifiers.
      {{/if}}
    {{/if}}
  </footer>
{{/with}}{{/if}}

</script>
<script id="search_autocomplete_menu_channels_template" type="text/x-handlebars-template">{{#if channels}}
  <div class="section_header"><hr><span class="header_label search_mini">Channels</span></div>
  <ol class="results channels">
    {{#each channels}}
      <li data-replacement="{{../conversation_modifier}}{{#if is_channel}}#{{/if}}{{name}}">
        <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>{{#if ../show_modifier}}<span class="normal">{{../../conversation_modifier}}</span>{{/if}}{{#if is_channel}}#{{/if}}{{name}}
      </li>
    {{/each}}

    {{#if ../channels_archived}}
      <li class="reveal_hidden_items"><div class="assistive_search_icon ellipsis_icon"></div><div class="assistive_search_icon down_caret_icon float_right"></div><span class="search_light_grey">Show {{channels_archived.length}} archived {{pluralize channels_archived.length "channel"}}</span></li>
      {{#each ../channels_archived}}
        <li data-replacement="{{../../conversation_modifier}}{{#if is_channel}}#{{/if}}{{name}}" class="hidden">
          <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>{{#if ../../show_modifier}}<span class="normal">{{../../../conversation_modifier}}</span>{{/if}}{{#if is_channel}}#{{/if}}{{name}}
        </li>
      {{/each}}
    {{/if}}
  </ol>
{{/if}}

</script>
<script id="search_autocomplete_menu_dms_template" type="text/x-handlebars-template">{{#if dms}}
  <div class="section_header"><hr><span class="header_label search_mini">Team members</span></div>
  <ol class="results dms">
    {{#each dms}}
      <li data-replacement="{{../conversation_modifier}}@{{name}}">
        <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>{{#if ../show_modifier}}<span class="normal">{{../../conversation_modifier}}</span>{{/if}}{{#if real_name}}{{real_name}} {{/if}}<span class="{{#if real_name}}username{{/if}}">@{{name}}</span>
      </li>
    {{/each}}

    {{#if ../dms_deleted}}
      <li class="reveal_hidden_items"><div class="assistive_search_icon ellipsis_icon"></div><div class="assistive_search_icon down_caret_icon float_right"></div><span class="search_light_grey">Show {{dms_deleted.length}} disabled {{pluralize users_deleted.length "account"}}</span></li>
      {{#each ../dms_deleted}}
        <li data-replacement="{{../../conversation_modifier}}@{{name}}" class="hidden">
          <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>{{#if ../../show_modifier}}<span class="normal">{{../../../conversation_modifier}}</span>{{/if}}{{#if real_name}}{{real_name}} {{/if}}<span class="{{#if real_name}}username{{/if}}">@{{name}}</span>
        </li>
      {{/each}}
    {{/if}}
  </ol>
{{/if}}

</script>
<script id="search_autocomplete_menu_groups_template" type="text/x-handlebars-template">{{#if groups}}
  <div class="section_header"><hr><span class="header_label search_mini">{{groupCopy caps=true}}s</span></div>
  <ol class="results groups">
    {{#each groups}}
      <li data-replacement="{{../conversation_modifier}}{{name}}"><i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>{{#if ../show_modifier}}<span class="normal">{{../../conversation_modifier}}</span>{{/if}}{{name}}</li>
    {{/each}}

    {{#if ../groups_archived}}
      <li class="reveal_hidden_items"><div class="assistive_search_icon ellipsis_icon"></div><div class="assistive_search_icon down_caret_icon float_right"></div><span class="search_light_grey">Show {{groups_archived.length}} archived {{pluralize groups_archived.length group_label}}</span></li>
      {{#each ../groups_archived}}
        <li data-replacement="{{../../conversation_modifier}}{{name}}" class="hidden">
          <i class="ts_icon ts_icon_plus_square_o ts_icon_inherit modifier_icon"></i>{{#if ../../show_modifier}}<span class="normal">{{../../../conversation_modifier}}</span>{{/if}}{{name}}
        </li>
      {{/each}}
    {{/if}}
  </ol>
{{/if}}

</script>

<script id="team_list_item_template" type="text/x-handlebars-template">	<div class="team_list_item member_item cursor_pointer active {{#isClient}}tiny_top_margin{{else}}expanded clearfix{{/isClient}}{{#feature flag="feature_custom_fields"}} feature_custom_fields{{/feature}}{{#if this.deleted}} inactive{{/if}}" data-member-id="{{this.id}}">
		
		{{!-- Avatar, Real Name, username, presence dot --}}
		<div class="member_details member_item_inset {{#isWeb}}col {{#feature flag="feature_custom_fields"}}span_5_of_12{{else}}span_2_of_6{{/feature}} no_bottom_margin{{/isWeb}}">
			{{{makeMemberPreviewLinkImage this.id 72 true}}}

			<div class="member_name_and_title{{#feature flag="feature_custom_fields"}}{{else}}{{#isClient}}{{else}} small_top_margin{{/isClient}}{{/feature}}">
				{{#if this.profile.real_name}} 
					<div class="{{getMemberColorClassById this.id}}">
						<a href="/team/{{this.name}}" {{#isClient}}target="/team/{{this.name}}"{{/isClient}} class="bold member_preview_link member_name no_bottom_margin" data-member-id="{{this.id}}">{{this.profile.real_name}}</a>
					</div>
				{{/if}}
				<div {{#unless this.profile.real_name}}class="{{getMemberColorClassById this.id}}"{{/unless}}>
					{{#if this.profile.real_name}}
						@{{this.name}}
					{{else}}
						<a href="/team/{{this.name}}" {{#isClient}}target="/team/{{this.name}}"{{/isClient}} class="bold member_preview_link member_name no_bottom_margin" data-member-id="{{this.id}}">{{this.name}}</a>
					{{/if}}
					{{#unless this.deleted}}{{{makeMemberPresenceIcon this}}}{{/unless}}

					{{#isClient}}
						{{#unless is_bot}}
							{{#isInDifferentTimeZone ../this}}
								<span class="mini timezone_label" data-member-id="{{this.id}}">{{{memberLocalTime this}}}</span>
							{{/isInDifferentTimeZone}}
						{{/unless}}
					{{else}}
						{{#unless is_bot}}
							{{#isInDifferentTimeZone ../this}}
								<span class="mini">{{memberUTCOffset this}}</span>
							{{/isInDifferentTimeZone}}
						{{/unless}}
					{{/isClient}}
					
				</div>

				{{#if this.profile}}
					{{#if this.profile.title}}<div class="member_title">{{this.profile.title}}</div>{{/if}}
				{{/if}}

				{{!-- In Client:  Phone, Email, Skype rendered here on demand... Not after feature_custom_fields changes (remove this comment when feature flag removed) --}}
			</div>

			{{#feature flag="feature_custom_fields"}}{{else}}{{#isClient}}<i class="ts_icon ts_icon_chevron_medium_down disclosure_arrow right_margin sky_blue"></i>{{/isClient}}{{/feature}}

		</div>

		{{!-- Team site: Phone, Email, Skype --}}
		{{#isWeb}}
			<div class="expanded_member_details small_top_padding col {{#feature flag="feature_custom_fields"}}span_6_of_12{{else}}span_3_of_6{{/feature}} no_bottom_margin">

				{{#if this.profile}}
					<table class="member_data_table{{#feature flag="feature_custom_fields"}} team_profile_fields{{/feature}}">
						{{#if this.profile.phone}}
							<tr>
								{{#feature flag="feature_custom_fields"}}
									<td><span class="small_right_padding old_petunia_grey" title="Phone Number">Phone Number</span></td>
									<td><a class="overflow_ellipsis" href="tel:{{this.profile.phone}}">{{this.profile.phone}}</a></td>
								{{else}}
									<td class="align_center small_right_padding"><i class="ts_icon ts_icon_phone"></i></td>
									<td><a href="tel:{{this.profile.phone}}">{{this.profile.phone}}</a></td>
								{{/feature}}
							</tr>
						{{/if}}
						{{#if this.profile.email}}
							<tr>
								{{#feature flag="feature_custom_fields"}}
									<td><span class="small_right_padding old_petunia_grey" title="Email">Email</span></td>
									<td><a class="overflow_ellipsis" href="mailto:{{this.profile.email}}" title="Email {{this.name}}">{{this.profile.email}}</a></td>
								{{else}}
									<td class="align_center small_right_padding"><i class="ts_icon ts_icon_share_email"></i></td>
									<td><a href="mailto:{{this.profile.email}}" title="Email {{this.name}}">{{this.profile.email}}</a></td>
								{{/feature}}
							</tr>
						{{/if}}
						{{#if this.profile.skype}}
							<tr>
								{{#feature flag="feature_custom_fields"}}
									<td><span class="small_right_padding old_petunia_grey" title="Skype">Skype</span></td>
									<td><a class="overflow_ellipsis" target="_blank" href="skype:{{this.profile.skype}}?call" title="Skype {{this.name}}"><i class="ts_icon ts_icon_skype"></i> {{this.profile.skype}}</a></td>
								{{else}}
									<td class="align_center small_right_padding"><i class="ts_icon ts_icon_skype"></i></td>
									<td><a href="skype:{{this.profile.skype}}?call" title="Skype {{this.name}}">{{this.profile.skype}}</a></td>
								{{/feature}}
							</tr>
						{{/if}}
						{{{getVisibleTeamProfileFieldsForMember this}}}
					</table>
				{{/if}}

			</div>

			{{!-- Buttons. Rendered on demand in the client. --}}
			<div class="col {{#feature flag="feature_custom_fields"}}span_1_of_12{{else}}span_1_of_6{{/feature}} no_bottom_margin no_right_padding">
				<a class="member_preview_menu_target member_action_button btn btn_outline float_right top_margin hide_on_mobile">
					<div class="team_directory_icon more_icon inline_block no_right_margin"></div>
				</a>
				<a class="member_preview_menu_target member_action_button btn btn_outline bottom_margin top_margin show_on_mobile subtle_silver">
					<div class="team_directory_icon more_icon inline_block small_right_margin"></div>More
				</a>
			</div>
		{{/isWeb}}
		
	</div>
</script>
<script id="team_list_item_details_template" type="text/x-handlebars-template">	{{!-- Phone, Email, Skype --}}
	<div class="expanded_member_details small_top_padding">

		{{#if this.profile}}
			<table class="member_data_table{{#feature flag="feature_custom_fields"}} team_profile_fields{{/feature}}">
				{{#if this.profile.phone}}
					<tr>
						{{#feature flag="feature_custom_fields"}}
							<td><span class="small_right_padding old_petunia_grey" title="Phone Number">Phone Number</span></td>
							<td><a class="overflow_ellipsis" href="tel:{{this.profile.phone}}">{{this.profile.phone}}</a></td>
						{{else}}
							<td class="align_center small_right_padding"><i class="ts_icon ts_icon_phone"></i></td>
							<td><a href="tel:{{this.profile.phone}}">{{this.profile.phone}}</a></td>
						{{/feature}}
					</tr>
				{{/if}}
				{{#if this.profile.email}}
					<tr>
						{{#feature flag="feature_custom_fields"}}
							<td><span class="small_right_padding old_petunia_grey" title="Email">Email</span></td>
							<td><a class="overflow_ellipsis" href="mailto:{{this.profile.email}}" title="Email {{this.name}}">{{this.profile.email}}</a></td>
						{{else}}
							<td class="align_center small_right_padding"><i class="ts_icon ts_icon_share_email"></i></td>
							<td><a href="mailto:{{this.profile.email}}" title="Email {{this.name}}">{{this.profile.email}}</a></td>
						{{/feature}}
					</tr>
				{{/if}}
				{{#if this.profile.skype}}
					<tr>
						{{#feature flag="feature_custom_fields"}}
							<td><span class="small_right_padding old_petunia_grey" title="Skype">Skype</span></td>
							<td><a class="overflow_ellipsis" target="_blank" href="skype:{{this.profile.skype}}?call" title="Skype {{this.name}}"><i class="ts_icon ts_icon_skype"></i> {{this.profile.skype}}</a></td>
						{{else}}
							<td class="align_center small_right_padding"><i class="ts_icon ts_icon_skype"></i></td>
							<td><a target="_blank" href="skype:{{this.profile.skype}}?call" title="Skype {{this.name}}">{{this.profile.skype}}</a></td>
						{{/feature}}
					</tr>
				{{/if}}
				{{{getVisibleTeamProfileFieldsForMember this}}}
			</table>
		{{/if}}

	</div>

</script>
<script id="team_list_item_buttons_template" type="text/x-handlebars-template">	<div class="expanded_member_details top_padding">

		<div class="{{#if this.is_self}}member_item_inset{{else}}team_directory_buttons{{/if}}">

			{{#if this.deleted}}
				{{#memberHasIm member=this}}
					<a href="/archives/{{this.name}}" data-member-name="{{this.name}}" class="btn btn_outline member_action_button flex_one overflow_ellipsis">
						<div class="team_directory_icon message_icon inline_block small_right_margin"></div>Message Archives
					</a>
				{{/memberHasIm}}
			{{else}}
				{{#unless this.is_self}}
					<a href="/messages/@{{this.name}}" target="/messages/@{{this.name}}" data-member-name="{{this.name}}" class="btn btn_outline internal_im_link team_list_dm_link member_action_button flex_one overflow_ellipsis">
						<div class="team_directory_icon message_icon inline_block small_right_margin internal_im_link" data-member-name="{{this.name}}"></div>Send Message
					</a>
				{{/unless}}

			{{/if}}

			<a class="member_preview_menu_target member_action_button flex_one btn btn_outline overflow_ellipsis">
				<div class="team_directory_icon more_icon inline_block small_right_margin"></div>More
			</a>

		</div>

	</div>

</script>
<script id="team_profile_fields_template" type="text/x-handlebars-template">{{#feature flag="feature_custom_fields"}}
	{{#if fields}}
		{{#each fields}}
			<tr>
				<td><span class="small_right_padding old_petunia_grey overflow_ellipsis" title="{{this.label}}">{{this.label}}</span></td>
				<td>
					<span title="{{#if this.alt}}{{this.alt}}{{else}}{{this.value}}{{/if}}">
						{{#if_equal this.type compare="link"}}
							<a target="_blank" href="{{this.value}}">{{{maybeGetIconForTeamProfileField this.label}}} {{#if this.alt}}{{this.alt}}{{else}}{{this.value}}{{/if}}</a>
						{{else}}
							{{{maybeGetIconForTeamProfileField this.label}}} {{#if this.alt}}{{this.alt}}{{else}}{{this.value}}{{/if}}
						{{/if_equal}}
					</span>
				</td>
			</tr>
		{{/each}}
	{{/if}}
{{/feature}}
</script>
<script id="team_list_template" type="text/x-handlebars-template">	<div id="team_list">
		<div class="tab-content large_bottom_margin">
			<div class="{{#isClient}}tab-pane{{else}}tab_pane{{/isClient}} selected active" id="active_members" data-tab="active">
				{{#each members}}
					{{> team_list_item}}
				{{/each}}
				{{#if show_bots}}
					{{#if bots}}
						<h5 class="bot_header large_top_margin no_bottom_margin subtle_silver"><i class="ts_icon ts_icon_inherit float_left ts_icon_bolt small_right_margin"></i> Bots</h5>
						{{#each bots}}
							{{> team_list_item is_bot=true}}
						{{/each}}
					{{/if}}
				{{/if}}
				<div id="active_no_results" class="no_results hidden"></div>
			</div>
			{{#if show_user_groups}}
				{{#isClient}}
					<div id="user_groups_list" data-tab="user_groups" class="{{#isClient}}tab-pane{{else}}tab_pane{{/isClient}}">
						{{!--
							{{> user_group_list is_flexpane="true"}}
						--}}
					</div>
				{{/isClient}}
			{{/if}}
			{{#if show_restricted_members}}
				<div class="{{#isClient}}tab-pane{{else}}tab_pane{{/isClient}}" id="restricted_members" data-tab="restricted">
					{{#if restricted_members}}
						<h5 class="restricted_header small_top_margin small_bottom_margin"><i class="presence large away ra small_right_margin"></i> Restricted Accounts</h5>
						{{#each restricted_members}}
							{{> team_list_item}}
						{{/each}}
					{{/if}}
					{{#if ultra_restricted_members}}
						<h5 class="restricted_header {{#if restricted_members}}large_top_margin{{else}}small_top_margin{{/if}} small_bottom_margin"><i class="presence large away ura small_right_margin"></i> Single-channel Guests</h5>
						{{#each ultra_restricted_members}}
							{{> team_list_item}}
						{{/each}}
					{{/if}}
					<div id="restricted_no_results" class="no_results hidden"></div>
					{{#isWeb}}
						<p class="help">
							These team members are restricted to the {{channelsOrGroupsCopy}} that they are invited to join.
							{{#currentUserIsAdmin}}
								<br />{{#isClient}}<br />{{/isClient}}
								<a href="/admin?tab=restricted" {{#isClient}}target="new"{{/isClient}} class="bold">Manage restricted accounts</a>
							{{/currentUserIsAdmin}}
						</p>
					{{/isWeb}}
				</div>
			{{/if}}
			{{#if disabled_members}}
				<div class="{{#isClient}}tab-pane{{else}}tab_pane{{/isClient}}" id="disabled_members" data-tab="disabled">
					{{#each disabled_members}}
						{{> team_list_item}}
					{{/each}}
					{{#if show_bots}}
						{{#if deleted_bots}}
							<h5 class="bot_header large_top_margin no_bottom_margin subtle_silver"><i class="ts_icon ts_icon_bolt small_right_margin"></i> Bots</h5>
							{{#each deleted_bots}}
								{{> team_list_item}}
							{{/each}}
						{{/if}}
					{{/if}}
					<div id="disabled_no_results" class="no_results hidden"></div>
					<p class="help">
						These team members have been disabled and can no longer access your team.
						{{#currentUserIsAdmin}}
							<br />
							<a href="/admin" class="bold" target="_blank">Manage disabled accounts</a>
						{{/currentUserIsAdmin}}
					</p>
				</div>
			{{/if}}
		</div>
	</div>
</script>
<script id="team_list_no_results_template" type="text/x-handlebars-template">	<div class="align_center">
		<p class="small_bottom_margin">No {{tab.label}} found matching <span class="query bold">{{query}}</span>.</p>
		{{#if show_pending_matches}}
			<p class="small_bottom_margin bold"><a onclick="TS.members.view.switchTabs('pending');">{{pending_matches.length}} pending {{pluralize pending_matches.length "invite" "invites"}} found</a></p>
		{{/if}}
		{{#if show_accepted_matches}}
			<p class="small_bottom_margin bold"><a onclick="TS.members.view.switchTabs('accepted');">{{accepted_matches.length}} accepted {{pluralize accepted_matches.length "invite" "invites"}} found</a></p>
		{{/if}}
		{{#if show_active_matches}}
			<p class="small_bottom_margin bold"><a onclick="TS.members.view.switchTabs('active');">{{active_matches.length}} full team {{pluralize active_matches.length "member" "members"}} found</a></p>
		{{/if}}
		{{#if show_restricted_matches}}
			<p class="small_bottom_margin bold"><a onclick="TS.members.view.switchTabs('restricted');">{{restricted_matches.length}} restricted {{pluralize restricted_matches.length "account" "accounts"}} found</a></p>
		{{/if}}
		{{#if show_disabled_matches}}
			<p class="small_bottom_margin bold"><a onclick="TS.members.view.switchTabs('disabled');">{{disabled_matches.length}} disabled {{pluralize disabled_matches.length "account" "accounts"}} found</a></p>
		{{/if}}
		<p class="top_margin"><a class="clear_members_filter btn btn_outline btn_small btn_outline btn_small">Clear search</a></p>
	</div>
</script>
<script id="team_tabs_template" type="text/x-handlebars-template">	{{#isWeb}}
		<div class="tab_set on_neutral_grey">
			{{#if members}}
				<a id="active_members_tab" data-tab="active" class="selected">Full Members <span class="normal">({{members.length}})</span></a>
			{{/if}}
			{{#if show_restricted_members}}
				<a id="restricted_members_tab" data-tab="restricted">Restricted & Guest Accounts <span class="normal">({{restricted_members.length}})</span></a>
			{{/if}}
			{{#if disabled_members}}
				<a id="disabled_members_tab" data-tab="disabled" class="secondary">Disabled Accounts <span class="normal">({{disabled_members.length}})</span></a>
			{{/if}}
			{{#if show_restricted_members}}
				<i class="tab_caret ts_icon ts_icon_caret_down"></i>
				<i class="tab_caret ts_icon ts_icon_caret_up"></i>
			{{else}}
				{{#if disabled_members}}
					<i class="tab_caret ts_icon ts_icon_caret_down"></i>
					<i class="tab_caret ts_icon ts_icon_caret_up"></i>
				{{/if}}
			{{/if}}
		</div>
	{{else}}
		<ul class="flexpane_tab_bar small_top_margin lato no_bottom_margin">
			{{#if members}}
		  		<li id="active_members_tab" class="bold active"><a href="#active_members" data-toggle="tab" data-name="active_members">{{#isWeb}}Full {{/isWeb}}{{#isMobileWeb}}{{else}}Members {{/isMobileWeb}}<span class="normal">({{members.length}})</span></a></li>
			{{/if}}
			{{#if show_restricted_members}}
		  		<li id="restricted_members_tab" class="bold"><a href="#restricted_members" data-toggle="tab" data-name="restricted_members">Restricted{{#isWeb}}{{#isMobileWeb}}{{else}} & Guest Accounts{{/isMobileWeb}}{{/isWeb}} <span class="normal">({{restricted_members.length}})</span></a></li>
			{{/if}}
			{{#isWeb}}
				{{#if disabled_members}}
		  			<li id="disabled_members_tab" class="bold float_right"><a href="#disabled_members" data-toggle="tab" data-name="disabled_members">Disabled{{#isMobileWeb}}{{else}} Accounts{{/isMobileWeb}} <span class="normal">({{disabled_members.length}})</span></a></li>
				{{/if}}
			{{/isWeb}}
		</ul>
	{{/isWeb}}
</script>
<script id="team_member_preview_template" type="text/x-handlebars-template">
<div class="member_details clearfix member_preview_inset{{#feature flag="feature_custom_fields"}} feature_custom_fields display_flex flex_direction_column align_items_center{{#isClient}} cropped_preview{{/isClient}}{{/feature}}">
	
	{{#feature flag="feature_custom_fields"}}
		{{{makeMemberPreviewLinkImage member.id 512 false true}}}
	{{else}}
		{{{makeMemberPreviewLinkImage member.id 72}}}
	{{/feature}}

	{{#feature flag="feature_custom_fields"}}
		<div class="member_name_and_presence lato">
			{{#if member.deleted}}
				<a href="/team/{{member.name}}" target={{newWindowName}} class="{{getMemberColorClassById member.id}} member_name">{{#if member.profile.real_name}}{{member.profile.real_name}}{{else}}@{{member.name}}{{/if}}</a>
			{{else}}
				{{#if member.is_self}}
					{{#isClient}}
						<a href="/team/{{member.name}}" target={{newWindowName}} class="{{getMemberColorClassById member.id}} member_name">{{#if member.profile.real_name}}{{member.profile.real_name}}{{else}}@{{member.name}}{{/if}}</a>
					{{else}}
						<span class="{{getMemberColorClassById member.id}} member_name">{{#if member.profile.real_name}}{{member.profile.real_name}}{{else}}@{{member.name}}{{/if}}</span>
					{{/isClient}}
				{{else}}
					<a href="/messages/@{{member.name}}" target="/messages/@{{member.name}}" data-member-name="{{member.name}}" class="{{getMemberColorClassById member.id}} member_name internal_im_link">{{#if member.profile.real_name}}{{member.profile.real_name}}{{else}}@{{member.name}}{{/if}}</a>
				{{/if}}
				{{{makeMemberPresenceIcon member}}}
			{{/if}}
		</div>

		{{#if member.profile}}
			{{#if member.profile.title}}
				<div class="member_title lato">{{member.profile.title}}</div>
			{{/if}}
		{{/if}}

		{{#if member.is_restricted}}
			<div class="member_restriction lato overflow_ellipsis">
				{{#if member.is_ultra_restricted}}
					Single-Channel Guest{{#if ura_channel}} in #{{ura_channel}}{{/if}}
				{{else}}
					Restricted Guest
				{{/if}}
			</div>
		{{/if}}

		<div class="member_action_bar">
			{{#isMobileWeb}}
				{{#memberHasIm member=member}}
					<a href="/archives/{{member.name}}" data-member-name="{{member.name}}" class="btn btn_outline">Archive</a>
				{{/memberHasIm}}
			{{else}}
				{{#if member.deleted}}
					{{#memberHasIm member=member}}
						<a href="/archives/{{member.name}}" data-member-name="{{member.name}}" class="btn btn_outline">Archive</a>
					{{/memberHasIm}}
				{{else}}
					{{#if member.is_self}}
						<a data-action="edit_member_profile_modal" class="btn btn_outline">Edit</a>
						<a href="/account/settings" target="{{newWindowName}}" class="btn btn_outline">Account</a>
					{{else}}
						{{#isClient}}
							<a href="/messages/@{{member.name}}" target="/messages/@{{member.name}}" data-member-name="{{member.name}}" class="btn btn_outline internal_im_link">Message</a>
							{{#and member.profile member.profile.phone}} 
								<a href="tel:{{member.profile.phone}}" class="btn btn_outline">Call</a>
							{{/and}}
						{{else}}
							{{!-- Show "configure" link only to the creator of the bot, and team admins: Web ONLY --}}
							{{#if show_bot_configuration}}
								{{#if member.profile}}
									<a href="/services/{{member.profile.bot_id}}" target="new" class="btn btn_outline">Configure</a>
								{{/if}}
							{{/if}}
							<a href="/messages/@{{member.name}}" target="new" class="btn btn_outline">Message</a>
							{{#memberHasIm member=member}}
								<a href="/archives/{{member.name}}" data-member-name="{{member.name}}" class="btn btn_outline">Archive</a>
							{{/memberHasIm}}
							{{#and member.files member.files.length}}
								<a href="/files/{{member.name}}" class="btn btn_outline">Files</a>
							{{/and}}
						{{/isClient}}
					{{/if}}
				{{/if}}
			{{/isMobileWeb}}

			{{#unless hide_more_menu}}
				<a class="member_preview_menu_target btn btn_outline"><i class="ts_icon ts_icon_chevron_large_down"></i></a>
			{{/unless}}

		</div>
	{{else}}
		<h2 class="no_bottom_margin" style="margin-top: 1px;">
			{{#if member.deleted}}
				<a href="/team/{{member.name}}" target={{newWindowName}} class="{{getMemberColorClassById member.id}} member_name">{{#if member.profile.real_name}}{{member.profile.real_name}}{{else}}@{{member.name}}{{/if}}</a>
			{{else}}
				{{#if member.is_self}}
					<a href="/team/{{member.name}}" target={{newWindowName}} class="{{getMemberColorClassById member.id}} member_name">{{#if member.profile.real_name}}{{member.profile.real_name}}{{else}}@{{member.name}}{{/if}}</a>
				{{else}}
					<a href="/messages/@{{member.name}}" target="/messages/@{{member.name}}" data-member-name="{{member.name}}" class="{{getMemberColorClassById member.id}} member_name internal_im_link">{{#if member.profile.real_name}}{{member.profile.real_name}}{{else}}@{{member.name}}{{/if}}</a>
				{{/if}}
				{{#unless member.profile.real_name}}{{{makeMemberPresenceIcon member}}}{{/unless}}
			{{/if}}
		</h2>

		<div class="lato" style="padding-bottom: 3px; margin-top: -1px;">
			{{#if member.real_name}}
				{{#if member.deleted}}
					<a href="/team/{{member.name}}" target={{newWindowName}}>@{{member.name}}</a>
				{{else}}
					{{#if member.is_self}}
						<a href="/team/{{member.name}}" target={{newWindowName}}>@{{member.name}}</a>
					{{else}}
						<a href="/messages/@{{member.name}}" target="/messages/@{{member.name}}" data-member-name="{{member.name}}" class="internal_im_link">@{{member.name}}</a>
					{{/if}}
					{{{makeMemberPresenceIcon member}}}
				{{/if}}
			{{/if}}
			{{#if member.is_restricted}}
				<span class="mini subtle_silver normal">
					{{#if member.is_ultra_restricted}}
						(Single-channel Guest)
					{{else}}
						(Restricted Account)
					{{/if}}
				</span>
			{{/if}}
		</div>

		{{#if member.profile}}
			{{#if member.profile.title}}
				<div class="lato tiny_top_margin" style="line-height:1.2rem;">{{member.profile.title}}</div>
			{{/if}}
		{{/if}}

	{{/feature}}

	{{#if member.profile}}
		{{#feature flag="feature_custom_fields"}}
			{{#or member.is_bot member.is_slackbot}}{{else}}
				<hr class="member_details_divider">
			{{/or}}
		{{/feature}}

		<table class="member_data_table lato{{#feature flag="feature_custom_fields"}} team_profile_fields{{else}} top_margin{{/feature}}">
			{{#feature flag="feature_custom_fields"}}
				{{#if member.profile.real_name}}
					<tr>
						<td><span class="small_right_padding old_petunia_grey" title="Username">Username</span></td>
						{{#if member.is_self}}
							<td><span title="@{{member.name}}">@{{member.name}}</span>
						{{else}}
							{{#isClient}}
								<td><a href="/messages/@{{member.name}}" target="/messages/@{{member.name}}" data-member-name="{{member.name}}" title="@{{member.name}}" class="internal_im_link">@{{member.name}}</a></td>
							{{else}}
								<td><a href="/messages/@{{member.name}}" target="new" title="@{{member.name}}">@{{member.name}}</a></td>
							{{/isClient}}
						{{/if}}
					</tr>
				{{/if}}
			{{/feature}}
			{{#unless member.is_slackbot}}
				{{#unless member.is_bot}}
					<tr>
						{{#feature flag="feature_custom_fields"}}
							<td><span class="small_right_padding old_petunia_grey" title="Timezone">Timezone</span></td>
							<td class="member_preview_timezone">{{{timezoneLabel member false}}}</td>
						{{else}}
							<td class="align_center small_right_padding"><i class="ts_icon ts_icon_clock_o"></i></td>
							<td class="member_preview_timezone">{{{timezoneLabel member false}}}</td>
						{{/feature}}
					</tr>
				{{/unless}}
			{{/unless}}
			{{#if member.profile.phone}}
				<tr>
					{{#feature flag="feature_custom_fields"}}
						<td><span class="small_right_padding old_petunia_grey" title="Phone Number">Phone Number</span></td>
						<td><a class="overflow_ellipsis" href="tel:{{member.profile.phone}}">{{member.profile.phone}}</a></td>
					{{else}}
						<td class="align_center small_right_padding"><i class="ts_icon ts_icon_phone"></i></td>
						<td><a href="tel:{{member.profile.phone}}">{{member.profile.phone}}</a></td>
					{{/feature}}
				</tr>
			{{/if}}
			{{#if member.profile.email}}
				<tr>
					{{#feature flag="feature_custom_fields"}}
						<td><span class="small_right_padding old_petunia_grey" title="Email">Email</span></td>
						<td><a class="overflow_ellipsis" href="mailto:{{member.profile.email}}" title="Email {{member.name}}">{{member.profile.email}}</a></td>
					{{else}}
						<td class="align_center small_right_padding"><i class="ts_icon ts_icon_envelope_o"></i></td>
						<td><a href="mailto:{{member.profile.email}}" title="Email {{member.name}}">{{member.profile.email}}</a></td>
					{{/feature}}
				</tr>
			{{/if}}
			{{#if member.profile.skype}}
				<tr>
					{{#feature flag="feature_custom_fields"}}
						<td><span class="small_right_padding old_petunia_grey" title="Skype">Skype</span></td>
						<td><a class="overflow_ellipsis" target="_blank" href="skype:{{member.profile.skype}}?call" title="Skype {{member.name}}"><i class="ts_icon ts_icon_skype"></i> {{member.profile.skype}}</a></td>
					{{else}}
						<td class="align_center small_right_padding"><i class="ts_icon ts_icon_skype"></i></td>
						<td><a {{#isClient}}target="_blank"{{/isClient}} href="skype:{{member.profile.skype}}?call" title="Skype {{member.name}}">{{member.profile.skype}}</a></td>
					{{/feature}}
				</tr>
			{{/if}}
			{{{getVisibleTeamProfileFieldsForMember member}}}
		</table>

		{{#feature flag="feature_custom_fields"}}{{else}}{{#if member.is_self}}
			<div class="mini small_top_margin">
				<a href="/account/settings" target="{{newWindowName}}">View Account</a> •
				<a href="/account/profile" target="{{newWindowName}}">Edit Profile</a>
			</div>
		{{/if}}{{/feature}}
	{{/if}}
	
	<div class="clear_both"></div>

</div>

{{#feature flag="feature_custom_fields"}}{{else}}
	<div class="top_margin {{#if member.is_self}}member_preview_inset{{/if}}">

		{{#isMobileWeb}}
			{{#memberHasIm member=member}}
				<a href="/archives/{{member.name}}" data-member-name="{{member.name}}" class="btn btn_outline member_action_button">
					<div class="team_directory_icon message_icon inline_block small_right_margin"></div> Message Archives
				</a>
			{{/memberHasIm}}
		{{else}}
			{{#if member.deleted}}
				{{#memberHasIm member=member}}
					<a href="/archives/{{member.name}}" data-member-name="{{member.name}}" class="btn btn_outline member_action_button">
						<div class="team_directory_icon message_icon inline_block small_right_margin"></div> Message Archives
					</a>
				{{/memberHasIm}}
			{{else}}
				{{#unless member.is_self}}
					{{#isClient}}
						<a href="/messages/@{{member.name}}" target="/messages/@{{member.name}}" data-member-name="{{member.name}}" class="btn btn_outline internal_im_link team_list_dm_link member_action_button">
							<div class="team_directory_icon message_icon inline_block small_right_margin internal_im_link" data-member-name="{{member.name}}"></div> Send Message
						</a>
					{{else}}
						{{#memberHasIm member=member}}
							<a href="/archives/{{member.name}}" data-member-name="{{member.name}}" class="btn btn_outline member_action_button">
								<div class="team_directory_icon more_icon inline_block small_right_margin"></div> Message Archives
							</a>
						{{/memberHasIm}}
					{{/isClient}}
				{{/unless}}

			{{/if}}
		{{/isMobileWeb}}

		{{#unless hide_more_menu}}
			<a class="member_preview_menu_target member_action_button btn btn_outline">
				<div class="team_directory_icon more_icon inline_block small_right_margin"></div> More
			</a>
		{{/unless}}

	</div>
{{/feature}}

{{#if member.is_slackbot}}
	<div class="help">
		<img src="{{versioned_slackbot_48}}" alt="Slackbot" class="small_top_margin float_right left_margin" />
		<p>Slackbot is here to help you use Slack. Slackbot will message you periodically with help, daily summaries and a few other things. You can get information from Slackbot by typing <strong>/help</strong> in your <a href="/messages/@slackbot" class="internal_im_link" data-member-name="slackbot">Slackbot DM</a>.</p>
		{{#isClient}}
			<i class="ts_icon ts_icon_question_circle callout" style="margin-top: -0.25rem;"></i>
			<p>If you have other questions about Slack, you might find the answer in our <a href="/help" target="{{newWindowName}}">Help Docs</a>. Or if you'd like, please <a href="/help/contact" target="{{newWindowName}}">get in touch</a>.</p>
		{{/isClient}}
	</div>

{{/if}}
</script>
<script id="dm_badge_template" type="text/x-handlebars-template">	<div class="dm_badge {{#if members}}feature_mpim_client{{else}}{{#feature flag='feature_private_channels'}}feature_mpim_client{{/feature}}{{/if}}">
		{{#if members}}
			{{#each members}}
				{{{makeMemberPreviewLinkImage this.id 72}}}
			{{/each}}
		{{else}}
			{{#feature flag='feature_private_channels'}}
				{{{makeMemberPreviewLinkImage member.id 72}}}
			{{else}}
				{{{makeMemberPreviewLinkImage member.id 48}}}
			{{/feature}}
		{{/if}}

		{{#if member.profile}}
			<p class="dm_badge_meta">
				{{#feature flag='feature_private_channels'}}
					{{#if member.profile.real_name}}
						<span class="member_real_name bold">{{member.profile.real_name}}</span>
					{{/if}}
					{{{makeMemberPresenceIcon member}}}
					<span class="{{getMemberColorClassById member.id}}">
						<a href="/team/{{member.name}}" class="member_preview_link member_name" data-member-id="{{member.id}}">@{{member.name}}</a>
					</span>
					<br />
					{{#if member.profile.title}}
						{{member.profile.title}}
					{{/if}}
				{{else}}
					{{#if member.profile.real_name}}
						<span class="member_real_name bold">{{member.profile.real_name}}</span><br />
					{{/if}}
					<span class="{{getMemberColorClassById member.id}}">
						<a href="/team/{{member.name}}" class="member_preview_link member_name" data-member-id="{{member.id}}">{{member.name}}</a>
					</span>
					{{{makeMemberPresenceIcon member}}}
					{{#if member.profile.title}}
						{{member.profile.title}}
					{{/if}}
				{{/feature}}
			</p>
		{{/if}}	
	</div>
		
	<p class="dm_explanation margin_auto align_left clear_both">
		This is <span class="not_limited_copy">the very beginning of</span> your direct message history with 
		{{#if members~}}
			{{#each members~}}
				{{#unless @first}}{{#if_gt ../../members.length compare=2}},{{/if_gt}} {{/unless}}{{#if @last}}and {{/if~}}
				<strong>{{getMemberDisplayName this}}</strong>
			{{~/each}}. 
		{{else}}
			<strong>{{getMemberDisplayName member}}</strong>. 
		{{/if}}

		{{#if compliance_exports_enabled_for_team}}
			Direct messages are generally private between {{#if members}}all of you{{else}}you and {{getMemberDisplayName member}}{{/if}}, but messages in this team sent on or after {{toDate compliance_export_start}} may be accessible to your team owners via <a href="https://slack.zendesk.com/hc/en-us/articles/203950296-FAQs-about-Slack-s-policy-update#complianceexport">Compliance Exports</a>. Sharing a private file here will allow {{#if members}}the group{{else}}<strong>{{getMemberDisplayName member}}</strong>{{/if}} to see and share it, but will not make it visible to other members of your team.
		{{else}}
			Direct messages are private between {{#if members}}all{{else}}the two{{/if}} of you. Sharing a private file here will not make it public, but it will allow {{#if members}}the group{{else}}<strong>{{getMemberDisplayName member}}</strong>{{/if}} to see and share it.
		{{/if}}
	</p>
</script>


<script id="user_status_form_template" type="text/x-handlebars-template">	<form id="user_status_form" class="no_bottom_margin inline_block" onsubmit="TS.client.ui.submitUserStatus('{{div_id}}');return false">
		<input type="text" id="user_status_input" value="{{user.status}}" />
		<input type="submit" class="btn btn_small" id="user_status_submit" value="Update">
	</form>
</script>

<script id="menu_template" type="text/x-handlebars-template"><div id="menu" class="menu">
	<div id="menu_header"></div>
	<div id="menu_items_scroller">
		<ul id="menu_items" role="menu" no-bootstrap="1">
			{{! 
				Markup for menu items is inserted here by TS.menu:
				<li id="menu_action_key" role="menuitem"><a>Item Label</a></li>
			}}
		</ul>
	</div>
	<div id="menu_footer"></div>
</div>
</script>
<script id="emoji_menu_template" type="text/x-handlebars-template"><div id="emoji_menu" class="menu">
	<div id="emoji_menu_header"></div>
	<div id="emoji_menu_items_scroller">
		<div id="emoji_menu_items_div"></div>
	</div>
	<div id="emoji_menu_footer">
	{{#if default_rxns}}
	<div id="emoji_div_default_rxns" class="hidden">
		<h3 id="emoji_h3_default_rxns">Handy Reactions</h3>
		<ul class="emoji_ul" id="emoji_ul_default_rxns" role="menu" no-bootstrap="1">
			{{~#each default_rxns~}}
				<li class="emoji_li" role="menuitem"><a data-name="{{this.name}}" data-names="{{this.names}}" data-icon="{{this.name}}">{{{this.html}}}</a></li>
			{{~/each~}}
		</ul>
	</div>
	{{/if}}
	
	<div id="emoji_preview">
		<span id="emoji_preview_img"></span>
		<div id="emoji_preview_text" class="overflow_ellipsis float_left">
			<span id="emoji_name"></span><br />
			<span id="emoji_aliases"></span>
		</div>
	</div>
	
	<div id="emoji_preview_deluxe">
		<span class="bold">Emoji Deluxe</span>™
	</div>
	
	<div id="emoji_skin_button" class="hidden"></div>
	<div id="emoji_skin_tip" class="hidden">Choose your preferred skin tone</div>
	<div id="emoji_skin_picker" class="hidden"></div>
	</div>
</div>
</script>
<script id="emoji_header_template" type="text/x-handlebars-template">	{{#each emoji_groups~}}
		<a class="emoji_grouping_tab {{#if_equal this.name compare=../active_group}}active{{/if_equal}}" data-group-name="{{this.name}}">{{{this.tab_html}}}</a>
	{{~/each}}
</script>
<script id="menu_group_header_template" type="text/x-handlebars-template">	<div class="menu_simple_header"><span class="overflow_ellipsis">{{{groupPrefix}}}{{group.name}}</span></div>
</script>
<script id="menu_group_items_template" type="text/x-handlebars-template"><li id="group_archives_item" role="menuitem">
	<a target="{{newWindowName}}" href="/archives/{{group.name}}">Open message archives</a>
</li>

<li id="group_star_item" class="star_link star_group {{#if group.is_starred}}starred{{/if}}" data-group-id="{{group.id}}" role="menuitem">
	<a>{{#if group.is_starred}}Unstar{{else}}Star{{/if}} this {{groupCopy skip_private=true}}</a>
</li>

<li class="divider"></li>

<li id="group_prefs" role="menuitem"><a>{{groupCopy caps=true skip_private=true}} notification preferences &hellip;</a></li>

{{#unless user.is_ultra_restricted}}
	{{#unless user.is_restricted}}
		<li id="group_add_service_item" role="menuitem"><a href="/services/new?channel_id={{group.id}}" target="{{newWindowName}}">Add a service integration &hellip;</a></li>
		<li id="group_invite_item" {{#if disable_invite}}class="disabled"{{/if}} role="menuitem"><a>Invite others to this {{groupCopy}} &hellip;</a></li>
	{{/unless}}
{{/unless}}

{{#if show_email_item}}
	<li id="group_email_item" role="menuitem">
		<a target="{{newWindowName}}" href="/services/new/email">
			Send email to this {{groupCopy skip_private=true}}
		</a>
	</li>
{{/if}}

{{#unless user.is_ultra_restricted}}
	{{#if user.is_restricted}}

		{{#if_equal leave_action compare='close'}}<li id="group_leave_item" role="menuitem"><a>Leave {{groupCopy skip_private=true}}</a></li>{{/if_equal}}

		<li id="group_invite_item" {{#if disable_invite}}class="disabled"{{/if}} role="menuitem"><a>Invite others to this {{groupCopy}} &hellip;</a></li>	

		{{#if_equal leave_action compare='leave_and_archive'}}<li id="group_leave_item" role="menuitem"><a>Leave and Archive {{groupCopy skip_private=true}}</a></li>{{/if_equal}}
		{{#if_equal leave_action compare='leave'}}<li id="group_leave_item" role="menuitem"><a>Leave {{groupCopy skip_private=true}}</a></li>{{/if_equal}}

	{{else}}
	
		{{#if group.is_archived}}
			<li id="group_unarchive_item" role="menuitem"><a>Un-archive {{groupCopy skip_private=true}}</a></li>
			<li id="group_leave_item" role="menuitem"><a>Leave {{groupCopy skip_private=true}}</a></li>
		{{else}}

			{{#if show_purpose_item}}
				<li id="group_purpose_item" role="menuitem"><a>Set {{groupCopy skip_private=true}} purpose &hellip;</a></li>
			{{/if}}

			<li id="group_advanced_item" role="menuitem"><a>Advanced options &hellip;</a></li>
				
			{{#if_equal leave_action compare='leave_and_archive'}}
				<li id="group_leave_item" role="menuitem"><a>Leave and Archive {{groupCopy skip_private=true}}</a></li>
			{{else}}
				<li id="group_leave_item" role="menuitem"><a>Leave {{groupCopy skip_private=true}}</a></li>
			{{/if_equal}}
		
		{{/if}}
	{{/if}}
{{/unless}}
</script>
	<script id="menu_mpim_items_template" type="text/x-handlebars-template"><li id="mpim_archives_item" role="menuitem">
	<a target="{{newWindowName}}" href="{{mpimArchivesPath mpim}}">Open message archives</a>
</li>

<li id="mpim_star_item" class="star_link star_mpim {{#if mpim.is_starred}}starred{{/if}}" data-mpim-id="{{mpim.id}}" role="menuitem">
	<a>{{#if mpim.is_starred}}Unstar{{else}}Star{{/if}} this conversation</a>
</li>

<li id="mpim_prefs" role="menuitem"><a>Conversation notification preferences &hellip;</a></li>

{{#if show_mpim_create}}<li id="mpim_create_mpim_item" role="menuitem"><a>Add someone &hellip;</a></li>{{/if}}</script>
<script id="menu_group_footer_template" type="text/x-handlebars-template">{{#unless user.is_restricted}}
	<div class="menu_footer menu_group_footer">
		<label class="mini">
			Set {{groupCopy skip_private=true}} topic
			<input type="text" id="menu_group_topic_input" class="small no_bottom_margin" value="{{unFormatMessage group.topic.value}}" maxlength="{{ChannelTopicMaxLength}}"/>
		</label>
	</div>
{{/unless}}</script>
<script id="menu_channel_header_template" type="text/x-handlebars-template">	<div class="menu_simple_header"><span class="overflow_ellipsis">#{{channel.name}}</span></div>
</script>
<script id="menu_channel_items_template" type="text/x-handlebars-template"><li id="channel_archives_item" role="menuitem">
	<a target="{{newWindowName}}" href="/archives/{{channel.name}}">View message archives</a>
</li>

{{#if channel.is_member}}
	<li id="channel_star_item" class="star_link star_channel {{#if channel.is_starred}}starred{{/if}}" data-channel-id="{{channel.id}}" role="menuitem">
		<a>{{#if channel.is_starred}}Unstar{{else}}Star{{/if}} this channel</a>
	</li>

	<li class="divider"></li>

	<li id="channel_prefs" role="menuitem"><a>Channel notification preferences &hellip;</a></li>
	
	{{#unless user.is_ultra_restricted}}
		{{#unless user.is_restricted}}
			<li id="channel_add_service_item"><a href="/services/new?channel_id={{channel.id}}" target="{{newWindowName}}" role="menuitem">Add a service integration &hellip;</a></li>
			{{#unless hide_invite}}<li id="channel_invite_item" {{#if disable_invite}}class="disabled"{{/if}} role="menuitem"><a>Invite others to this channel &hellip;</a></li>{{/unless}}
		{{/unless}}
	{{/unless}}

	{{#if show_email_item}}
		<li id="channel_email_item" role="menuitem">
			<a target="{{newWindowName}}" href="/services/new/email">Send email to this channel</a>
		</li>
	{{/if}}
{{/if}}
	
{{#unless user.is_ultra_restricted}}
	
	{{#if user.is_restricted}}
		{{#if channel.is_member}}
			{{#unless hide_invite}}<li id="channel_invite_item" {{#if disable_invite}}class="disabled"{{/if}} role="menuitem"><a>Invite others to this channel &hellip;</a></li>{{/unless}}
		{{/if}}
	{{else}}
	
		{{#if show_purpose_item}}
			<li id="channel_purpose_item" role="menuitem"><a>Set the channel purpose &hellip;</a></li>
		{{/if}}
	
		{{#if channel.is_archived}}
			{{#if channel.was_archived_this_session}}
				{{#unless channel.is_general}}<li id="channel_close_archived_item" role="menuitem"><a>Leave channel</a></li>{{/unless}}
			{{/if}}
			<li id="channel_unarchive_item" role="menuitem"><a>Un-archive channel</a></li>
		{{else}}

			{{#if show_advanced_item}}
				<li id="channel_advanced_item" role="menuitem"><a>Advanced options &hellip;</a></li>	
			{{/if}}		
				
			{{#if channel.is_member}}
				{{#unless channel.is_general}}<li id="channel_leave_item" role="menuitem"><a>Leave channel</a></li>{{/unless}}
			{{else}}
				<li id="channel_join_item" role="menuitem"><a>Join channel</a></li>
			{{/if}}
		{{/if}}

	{{/if}}
{{/unless}}</script>
<script id="menu_channel_footer_template" type="text/x-handlebars-template">{{#if show_topic}}
	<div class="menu_footer menu_channel_footer">
		<label class="mini">
			Set channel topic
			<input type="text" id="menu_channel_topic_input" class="small no_bottom_margin" value="{{unFormatMessage channel.topic.value}}" maxlength="{{ChannelTopicMaxLength}}"/>
		</label>
	</div>
{{/if}}</script>
<script id="menu_groups_header_template" type="text/x-handlebars-template">	<div class="menu_simple_header"><h4 class="no_bottom_margin" style="font-size: 1rem;">{{privateGroupsCopy caps=true}}</h4></div>
</script>
<script id="menu_groups_items_template" type="text/x-handlebars-template">{{#each nondisplayed_groups}}
	<li data-group-id="{{this.id}}" role="menuitem"><a href="/archives/{{this.name}}"><span style="color: #AAA;">{{{groupPrefix}}}</span>{{this.name}}
	({{#if_equal this.active_members.length compare=1}}1 member{{else}}{{this.active_members.length}} members{{/if_equal}})</a></li>
{{/each}}
{{#if nondisplayed_groups}}<li class="divider"></li>{{/if}}
{{#canUserCreateGroups}}
	<li id="new_group_item"><a><i class="ts_icon ts_icon_plus"></i> Create a new group...</a></li>
{{/canUserCreateGroups}}
{{#if show_archived_item}}
	<li id="groups_archives_item" role="menuitem"><a target="{{newWindowName}}" href="/groups"><i class="ts_icon ts_icon_archive"></i> View archived groups...</a></li>
{{/if}}
<li id="about_groups_item" role="menuitem"><a target="{{newWindowName}}" href="/help/private-groups"><i class="ts_icon ts_icon_info_circle"></i> About private groups...</a></li></script>
<script id="menu_member_header_template" type="text/x-handlebars-template">{{#feature flag="feature_custom_fields"}}
	<div class="menu_member_header">
		<div class="member_details feature_custom_fields display_flex flex_direction_column align_items_flex_start cropped_preview">
			{{{makeMemberPreviewCardLinkImage member.id}}}

			{{#if member.is_restricted}}
				<p class="member_restriction lato overflow_ellipsis">
					{{#if member.is_ultra_restricted}}
						Single-Channel Guest{{#if ura_channel}} in #{{ura_channel}}{{/if}}
					{{else}}
						Restricted Guest
					{{/if}}
				</p>
			{{/if}}

			<p class="member_timezone_value">
				{{{memberLocalTime member true}}}{{#if member.is_self}} (<a href='/account/settings' target='new'>change</a>){{/if}}
			</p>

			<div class="member_details_over_image">
				<div class="member_name_and_presence lato">
					{{#if member.deleted}}
						<a href="/team/{{member.name}}" target={{newWindowName}} class="member_name">{{#if member.profile.real_name}}{{member.profile.real_name}}{{else}}@{{member.name}}{{/if}}</a>
					{{else}}
						{{#if member.is_self}}
							<a href="/team/{{member.name}}" target={{newWindowName}} class="member_name">{{#if member.profile.real_name}}{{member.profile.real_name}}{{else}}@{{member.name}}{{/if}}</a>
						{{else}}
							<a href="/messages/@{{member.name}}" target="/messages/@{{member.name}}" data-member-name="{{member.name}}" class="member_name internal_im_link">{{#if member.profile.real_name}}{{member.profile.real_name}}{{else}}@{{member.name}}{{/if}}</a>
						{{/if}}
						{{{makeMemberPresenceIcon member}}}
					{{/if}}
				</div>

				{{#if member.profile}}
					{{#if member.profile.title}}
						<div class="member_title lato">{{member.profile.title}}</div>
					{{/if}}
				{{/if}}
			</div>
		</div>

		<hr class="member_details_divider">
	</div>
{{else}}
	<div class="menu_member_header">
		<div class="menu_member_user_details">
			{{{makeMemberPreviewLinkImage member.id 48}}}
			<span class="member_name">{{member.name}}</span>
			{{{makeMemberPresenceIcon member}}}
			{{#if member.is_restricted}}
				<span class="mini subtle_silver normal">
				{{#if member.is_ultra_restricted}}
					(Single-channel Guest)
				{{else}}
					(Restricted Account)
				{{/if}}
				</span>
			{{/if}}
			<br />			
			<span class="member_real_name">{{#if member.real_name}}{{member.real_name}}{{else}}&nbsp;{{/if}}</span>
			{{#unless member.is_slackbot}}
				{{#memberIsSelf id=member.id}}
				{{else}}
					{{#if member.profile.title}}
						<div class="member_title"><i class="ts_icon ts_icon_user"></i> {{member.profile.title}}</div>
					{{/if}}
					{{#unless member.is_bot}}
						<div class="member_tz no_wrap">{{{timezoneLabel member true}}}</div>
					{{/unless}}
				{{/memberIsSelf}}
			{{/unless}}
		</div>
	</div>
{{/feature}}
</script>
<script id="menu_member_items_template" type="text/x-handlebars-template">{{#if member.is_self}}
	<li id="member_prefs_item" role="menuitem"><a>{{#feature flag="feature_custom_fields"}}View preferences{{else}}Preferences{{/feature}}</a></li>
	<li id="member_account_item" role="menuitem"><a href="/account/settings" target="{{newWindowName}}">{{#feature flag="feature_custom_fields"}}Open account settings{{else}}Account{{/feature}}</a></li>
	{{#unless hide_view_profile}}
		<li id="member_profile_item" role="menuitem">{{#feature flag="feature_custom_fields"}}<a>Edit your profile</a>{{else}}<a href="/team/{{member.name}}">Profile</a>{{/feature}}</li>
	{{/unless}}
	{{#if member.has_files}}<li id="member_files_item" role="menuitem"><a href="/files/{{member.name}}" target="{{newWindowName}}">{{#feature flag="feature_custom_fields"}}View your files{{else}}Files{{/feature}}</a></li>{{/if}}
	{{#feature flag="feature_custom_fields"}}{{else}}<li id="member_photo_item" role="menuitem"><a href="/account/photo" target="{{newWindowName}}">Change your photo</a></li>{{/feature}}
	<li id="member_presence" role="menuitem">
		<a>
			<span class="menu_item_label">
				{{#if_equal member.presence compare="active"}}
					Set yourself away&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
				{{else}}
					[Away] Set yourself active
				{{/if_equal}}
			</span>
		</a>
	</li>

	{{#if hide_view_profile}}
		<li id="member_open_profile_item" role="menuitem"><a target="{{newWindowName}}" href="/team/{{member.name}}">Open profile in new window</a></li>
	{{/if}}

	<li class="divider"></li>
	
	{{#if other_accounts}}
		{{#each other_accounts}}
			<li class="switch_team" data-team-id="{{this.team_id}}" role="menuitem">
				<a href="{{this.team_url}}messages">Switch to {{this.name}} ({{this.team_name}})</a>
			</li>
		{{/each}}
	{{/if}}

	{{#if logout_url}}
		<li id="logout" role="menuitem">
			<a href="{{logout_url}}">Sign Out</a>
		</li>
	{{/if}}
	
{{else}}
	{{#if im}}
		<li id="member_archives_item" role="menuitem">		
			<a target="{{newWindowName}}" href="/archives/{{im.id}}">Open message archives</a>
		</li>
		<li id="member_star_item" class="star_link star_im {{#if im.is_starred}}starred{{/if}}" data-im-id="{{im.id}}" role="menuitem">
			<a>{{#if im.is_starred}}Unstar{{else}}Star{{/if}} this conversation</a>
		</li>
		{{#if show_email_item}}
			<li id="member_email_item" role="menuitem">
				<a target="{{newWindowName}}" href="/services/new/email">
					Send email to this conversation
				</a>
			</li>
		{{/if}}
		<li class="divider"></li>
	{{/if}}
	{{#unless hide_view_profile}}
		<li id="member_profile_item" role="menuitem"><a href="/team/{{member.name}}">View profile</a></li>
	{{/unless}}
	{{#if is_team_directory}}
		{{#if im_id}}
			<li id="member_archives_item" role="menuitem">		
				<a target="{{newWindowName}}" href="/archives/{{im_id}}">Open message archives</a>
			</li>
		{{/if}}
	{{/if}}

	{{#if show_dm_item}}
		{{#unless member.deleted}}
			<li id="member_dm_item" role="menuitem"><a href="/messages/@{{member.name}}">Direct Messages</a></li>
		{{/unless}}
	{{/if}}
	{{#unless is_team_directory}}
		{{#if member.profile.skype}}<li id="member_skype_item" role="menuitem"><a href="skype:{{member.profile.skype}}?call" target="{{newWindowName}}">Call on Skype ({{member.profile.skype}})</a></li>{{/if}}
	{{/unless}}

	{{#if member.has_files}}<li id="member_files_item" role="menuitem"><a href="/files/{{member.name}}" target="{{newWindowName}}"> View files</a></li>{{/if}}
	{{#if channel_kick_name}}<li id="member_kick_channel_item" role="menuitem"><a>Remove from <b>{{channel_kick_name}}</b></a></li>{{/if}}
	{{#if show_channel_invite}}<li id="member_invite_channel_item" role="menuitem"><a>Invite to a channel &hellip;</a></li>{{/if}}
	{{#if show_group_invite}}<li id="member_invite_group_item" role="menuitem"><a>Invite to a {{privateGroupCopy}}...</a></li>{{/if}}
	{{#feature flag="feature_private_channels"}}{{else}}
		{{#if show_group_create}}<li id="member_create_group_item"><a>Create a new {{privateGroupCopy}} &hellip;</a></li>{{/if}}
	{{/feature}}

	{{#if show_slackbot_responses_item}}
		<li id="member_slackbot_responses" role="menuitem"><a href="/customize/slackbot" target="{{newWindowName}}">Create/edit Slackbot responses</a></li>
	{{/if}}

	{{#if hide_view_profile}}
		<li id="member_open_profile_item" role="menuitem"><a target="{{newWindowName}}" href="/team/{{member.name}}">Open profile in new window</a></li>
	{{/if}}
	
	{{#if show_hide_messages_item}}
		<li id="member_hide_messages_item" role="menuitem"><a>TS Experiment: hide messages</a></li>
	{{/if}}
	{{#if show_unhide_messages_item}}
		<li id="member_unhide_messages_item" role="menuitem"><a>TS Experiment: un-hide messages</a></li>
	{{/if}}
{{/if}}</script>
<script id="menu_member_items_short_template" type="text/x-handlebars-template"><li id="member_profile_item" role="menuitem"><a href="/team/{{member.name}}"><i class="ts_icon ts_icon_user"></i>View Profile</a></li>
{{#unless member.is_self}}
	{{#if im_id}}
		<li id="member_archives_item" role="menuitem">		
			<a href="/archives/{{im_id}}">
				<i class="ts_icon ts_icon_align_left"></i>Open message archives
			</a>
		</li>
	{{/if}}
{{/unless}}
<li id="member_files_item" role="menuitem"><a href="/files/{{member.name}}"> View Files</a></li></script>
<script id="menu_member_footer_template" type="text/x-handlebars-template">{{#feature flag="feature_custom_fields"}}
	<div class="menu_member_footer">
		{{#if member.deleted}}
			<p class="no_bottom_margin">This user account is inactive.</p>
		{{else}}
			<input type="text" id="menu_member_dm_input" class="small" placeholder="Direct message @{{member.name}}" />
		{{/if}}
	</div>
{{else}}
	<div class="menu_footer">
		{{#if member.deleted}}
			<p class="no_bottom_margin">This user account is inactive.</p>
		{{else}}
			<input type="text" id="menu_member_dm_input" class="small no_bottom_margin" placeholder="Send a direct message" />
		{{/if}}
	</div>
{{/feature}}
</script>
<script id="menu_team_and_user_items_template" type="text/x-handlebars-template"><div class="section_header"><hr><span class="header_label menu_mini">You</span></div>

<li id="member_prefs_item" role="menuitem"><a href="/home">Preferences</a></li>

<li id="member_account_item" data-qa="member_account_link" role="menuitem">
	<a href="/account/settings" target="{{newWindowName}}">Profile &amp; Account</a>
</li>

{{#if help_url}}
	<li id="team_help" role="menuitem"><a href="/help">Help &amp; Feedback</a></li>
{{/if}}

{{#isOurApp}}{{else}}
	<li id="team_apps" role="menuitem"><a href="/apps" target="{{newWindowName}}">Get Slack Apps</a></li>
{{/isOurApp}}

<li id="member_presence" role="menuitem">
	<a>
		<span class="menu_item_label">
			{{#if_equal user.presence compare="active"}}
				Set yourself away
			{{else}}
				[Away] Set yourself to active
			{{/if_equal}}
		</span>
	</a>
</li>

{{#if this.show_version_info}}
	<li id="version_info" role="menuitem">
		<a href="javascript:void(0)">Version Info (TS only)</a>
	</li>
{{/if}}

<div class="section_header"><hr><div class="header_label_container overflow_ellipsis"><span class="header_label menu_mini"> {{team_name}}</span></div></div>

{{#if this.user.is_admin}}
	<li id="team_settings" role="menuitem">
		<a href="/admin/settings" target="{{newWindowName}}">Team Settings</a>
	</li>
{{/if}}

{{#if this.user.is_admin}}
	<li id="manage_team" role="menuitem">
		<a href="/admin" target="{{newWindowName}}">Manage Your Team</a>
	</li>
{{/if}}

{{#if this.user.is_owner}}
	<li id="team_billing" role="menuitem">
		<a href="/admin/billing" target="{{newWindowName}}">Billing</a>
	</li>
{{/if}}

{{#unless this.user.is_restricted}}
	<li id="team_services" role="menuitem">
		<a href="/services/new" target="{{newWindowName}}">Configure Integrations</a>
	</li>

	<li id="team_customize" role="menuitem">
		<a href="/customize/emoji" target="{{newWindowName}}">Customize Slack</a>
	</li>
{{/unless}}

<li id="team_home" role="menuitem"><a href="/team">Team Directory</a></li>

{{#if this.user.is_admin}}
	<li id="team_invitations" role="menuitem">
		<a href="/admin/invites" target="{{newWindowName}}">Invite People</a>
	</li>
{{/if}}

<div class="section_header"><hr><span class="header_label menu_mini">Your teams</span></div>

{{#isOurApp}}{{else}}
	{{#if other_accounts}}		
		{{#each other_accounts}}
			<li class="switch_team" data-team-id="{{this.team_id}}" data-user-id="{{this.id}}" role="menuitem">
				<a href="{{this.team_url}}messages">Switch to <strong>{{this.team_name}}</strong></a>
			</li>
		{{/each}}
	{{/if}}
{{/isOurApp}}

{{#if logout_url}}
	<li id="logout" role="menuitem"><a href="{{logout_url}}">Sign out of <strong>{{team_name}}</strong></a></li>
{{/if}}

{{#if signin_url}}
	<li id="add_team" role="menuitem"><a href="{{signin_url}}"> Sign in to another team &hellip;</a></li>
{{/if}}
</script>
<script id="menu_user_footer_template" type="text/x-handlebars-template">	{{#feature flag="feature_status"}}
	<div class="menu_footer">
		Set your status:<br />
		<input type="text" id="menu_user_status_input" data-behavior="placeholder" data-hint="Set your status" value="{{user.status}}" />
	</div>
	{{/feature}}
</script>
<script id="menu_members_header_template" type="text/x-handlebars-template">	<div class="menu_simple_header" style="width: 280px; padding: 0.6rem 0.5rem;">
		<a class="ts_icon ts_icon_times_circle menu_close"></a>
		<h4 class="no_bottom_margin" style="margin-left: 0.25rem; font-size: 1rem;">Direct Message</h4>
	</div>
	{{#if show_filter}}
		<div id="dms_filter" class="position_relative" data-list-items-id="#menu">
			<i class="icon_search ts_icon ts_icon_search"></i>
			<a class="icon_close ts_icon ts_icon_times_circle hidden"></a>
			<input type="text" class="member_filter" name="team_filter" placeholder="Find by name" />
			<p id="dms_no_matches" class='no_results hidden subtle_silver'>
				No team members found matching <span class="query bold"></span>.
			</p>
		</div>
	{{/if}}
	{{#if large_team}}
		<p id="dms_filter_show_all">
			Search, or <a href="#" class="show_all">show all members</a>.
		</p>
	{{/if}}
</script>
<script id="menu_members_items_template" type="text/x-handlebars-template">{{#each members}}
	<li class="dm_list_item member_item active" data-member-id="{{this.id}}" role="menuitem">
		<a href="/team/{{this.name}}">
			{{{makeMemberImage this.id 36 true}}}
			<span class="dm_list_username overflow_ellipsis">
				{{this.name}}
				{{{makeMemberPresenceIcon this}}}
			</span>
			{{#if this.profile}}
				{{#if this.profile.real_name}}
					<br />
					<span class="dm_list_real_name overflow_ellipsis">{{this.profile.real_name}}</span>
				{{/if}}
			{{/if}}
		</a>
	</li>
{{/each}}</script>
<script id="menu_members_footer_template" type="text/x-handlebars-template">	<div class="menu_footer">
		<a id="about_dms_link" target="{{newWindowName}}" href="/help/direct-messages" class="align_right"><i class="ts_icon ts_icon_info_circle ts_icon_inherit"></i> About direct messages...</a>
	</div>
</script>
<script id="menu_emoticons_template" type="text/x-handlebars-template"><input id="emoji_input" type="text" placeholder="Search"><i class="ts_icon ts_icon_search icon_search subtle_silver"></i>
<h3 id="emoji_search_results_h3" class="hidden clear_both">Search Results</h3>

{{!<div id="emoji_rxns_section_div" class="emoji_section_div">
	<h3 id="emoji_rxns_h3" class="clear_both">This guy</h3>
	<div id="emoji_rxns_panel_container"></div>
</div>}}

{{! NOTE: white space is important here because we display these div inline when searching, so leave as is, though ugly }}
{{~#each emoji_groups~}}<div class="emoji_section_div"><h3 id="emoji_h3_{{this.name}}" class="clear_both {{this.name}}" data-group-name="{{this.name}}">{{this.display_name}}</h3><ul class="emoji_ul" id="emoji_ul_{{this.name}}" data-group-name="{{this.name}}">
		{{~#each this.items~}}
			{{~#if this~}}
				{{~#feature flag="feature_rxn_skin_tone_modifiers"~}}
					<li class="emoji_li {{#if this.is_skin}}skin_tone skin_tone_{{this.skin_tone_id}}{{/if}}" data-names="{{this.names}}"><a data-name="{{this.name}}" data-names="{{this.names}}" data-icon="{{this.name}}">{{{this.html}}}</a></li>
				{{~else~}}
					{{~#unless this.is_skin~}}
						<li class="emoji_li" data-names="{{this.names}}"><a data-name="{{this.name}}" data-names="{{this.names}}" data-icon="{{this.name}}">{{{this.html}}}</a></li>
					{{~/unless~}}
				{{~/feature~}}
			{{~/if~}}
		{{~/each~}}
</ul></div>{{~/each~}}

<div id="emoji_zero_results" class="hidden"><i class="fa fa-ban"></i> &nbsp;No emoji found<br></div>
	
<div id="emoji_tip"><i class="fa fa-info-circle"></i> &nbsp;Type <b>":"</b> and hit TAB key for autocomplete<br>
</script>
<script id="menu_call_button_template" type="text/x-handlebars-template"><i class="ts_icon ts_icon_phone call_icon {{#unless can_make_calls}}call_window_offline{{/unless}} {{#if is_dm_user_offline}}away{{/if}} {{#if is_dm}}{{makeMemberDomId dm_member}}{{/if}}" title="{{#if is_dm}}{{#if is_dm_user_offline}}{{name}} is currently offline and unreachable{{else}}Call {{name}}{{/if}}{{else}}{{#if is_mpdm}}Call {{names}}{{else}}Start and share a call in this channel{{/if}}{{/if}}"></i></script>
<script id="menu_file_filter_items_template" type="text/x-handlebars-template"><li data-filetype="all" {{#if_equal active_type compare='all'}}class="active"{{/if_equal}} role="menuitem">
	<a><i class="ts_icon ts_icon_all_files_alt"></i> All File Types</a>
</li>
{{#feature flag="feature_spaces"}}{{else}}
<li data-filetype="posts" {{#if_equal active_type compare='posts'}}class="active"{{/if_equal}} role="menuitem">
	<a><i class="ts_icon ts_icon_create_post"></i> Posts</a>
</li>
{{/feature}}
{{#feature flag="feature_spaces"}}
	<li data-filetype="spaces" {{#if_equal active_type compare='spaces'}}class="active"{{/if_equal}} role="menuitem">
		<a><i class="ts_icon ts_icon_create_post"></i> Posts</a>
	</li>
{{/feature}}
<li data-filetype="snippets" {{#if_equal active_type compare='snippets'}}class="active"{{/if_equal}} role="menuitem">
	<a><i class="ts_icon ts_icon_create_snippet"></i> Snippets</a>
</li>
{{#if show_email_item}}
	<li data-filetype="emails" {{#if_equal active_type compare='emails'}}class="active"{{/if_equal}} role="menuitem">
		<a><i class="ts_icon ts_icon_share_email"></i> Emails</a>
	</li>
{{/if}}
<li data-filetype="images" {{#if_equal active_type compare='images'}}class="active"{{/if_equal}} role="menuitem">
	<a><i class="ts_icon ts_icon_image"></i> Images</a>
</li>
<li data-filetype="pdfs" {{#if_equal active_type compare='pdfs'}}class="active"{{/if_equal}} role="menuitem">
	<a><i class="ts_icon ts_icon_book"></i> PDF Files</a>
</li>
<li data-filetype="gdocs" {{#if_equal active_type compare='gdocs'}}class="active"{{/if_equal}} role="menuitem">
	<a><i class="ts_icon ts_icon_google_drive"></i> Google Docs</a>
</li></script>
<script id="menu_file_member_header_template" type="text/x-handlebars-template">	<div id="file_member_filter" data-list-items-id="#menu">
		<i class="icon_search ts_icon ts_icon_search"></i>
		<a class="ts_icon ts_icon_times_circle icon_close hidden"></a>
		<input type="text" class="member_filter no_margin" placeholder="Find by name" />
		<p id="file_member_filter_no_matches" class='no_results hidden subtle_silver'>
			No team members found matching <span class="query bold"></span>.
		</p>
	</div>
</script>
<script id="menu_file_member_filter_items_template" type="text/x-handlebars-template">{{#each members}}
	{{#unless this.deleted}}
		<li class="member_item active" data-member-id="{{this.id}}" role="menuitem">
			<a href="#"><span class="wrapper">{{{makeMemberPreviewLinkImage this.id 24 true true}}}</span><span class="name">{{getMemberDisplayName this}}</span></a>
		</li>
	{{/unless}}
{{/each}}</script>
<script id="menu_message_action_items_template" type="text/x-handlebars-template">{{#if actions.pin_msg}}
	<li id="pin_link" data-msg-ts="{{msg.ts}}" role="menuitem"><a>Pin to {{pinToLabel model_ob}}</a></li>
{{/if}}

{{#if actions.unpin_msg}}
	<li id="unpin_link" data-msg-ts="{{msg.ts}}" role="menuitem"><a>Un-pin from {{pinToLabel model_ob}}</a></li>
{{/if}}

{{#feature flag="email_integration"}}
	{{#if actions.open_original}}
		<li id="open_original_link" data-file-id="{{msg.file.id}}" role="menuitem">
			<a href="{{msg.file.url_private}}" target="{{msg.file.id}}">
				{{#if_equal msg.file.mode compare="snippet"}}View raw{{else}}Open original{{/if_equal}}
			</a>
		</li>
	{{/if}}
{{/feature}}

{{#if actions.add_rxn}}
	<li id="rxn_link" data-rxn-key="{{msg._rxn_key}}" role="menuitem"><a>Add a reaction</a></li>
{{/if}}

{{#if actions.add_file_rxn}}
	<li id="rxn_link" data-rxn-key="{{msg.file._rxn_key}}" role="menuitem"><a>Add a reaction</a></li>
{{/if}}

{{#if actions.add_file_comment_rxn}}
	<li id="rxn_link" data-rxn-key="{{msg.comment._rxn_key}}" role="menuitem"><a>Add a reaction</a></li>
{{/if}}

{{#feature flag="feature_new_message_markup"}}
	{{#if actions.mark_unread}}
		<li id="mark_unread" data-msg-ts="{{msg.ts}}" role="menuitem"><a>Mark unread</a></li>
	{{/if}}
{{/feature}}

{{#if actions.edit_msg}}
	<li id="edit_link" data-msg-ts="{{msg.ts}}" role="menuitem"><a>Edit message</a></li>
{{/if}}

{{#if actions.delete_msg}}
	<li class="divider"></li>
	<li id="delete_link" data-msg-ts="{{msg.ts}}" class="danger" role="menuitem"><a>Delete message</a></li>
{{/if}}</script>
<script id="menu_comment_action_items_template" type="text/x-handlebars-template">{{#if actions.can_pin}}
	<li id="pin_comment" data-file-id="{{file.id}}" data-comment-id="{{comment.id}}" role="menuitem"><a>Pin to {{#if model_ob.is_channel}}#{{/if}}{{model_ob.name}}</a></li>
{{/if}}
{{#if actions.can_unpin}}
	<li id="unpin_comment" data-file-id="{{file.id}}" data-comment-id="{{comment.id}}" role="menuitem"><a>Un-pin from {{#if model_ob.is_channel}}#{{/if}}{{model_ob.name}}</a></li>
{{/if}}
{{#if actions.rxn_file_comment}}
	<li id="rxn_file_comment" data-file-id="{{file.id}}" data-rxn-key="{{comment._rxn_key}}" role="menuitem"><a>Add a reaction</a></li>
{{/if}}
{{#if actions.can_edit}}
	<li id="edit_file_comment" data-file-id="{{file.id}}" data-comment-id="{{comment.id}}" role="menuitem"><a>Edit comment</a></li>
{{/if}}
{{#if actions.can_delete}}
	<li class="divider"></li>
	<li id="delete_file_comment" class="danger" data-file-id="{{file.id}}" data-comment-id="{{comment.id}}" role="menuitem"><a>Delete comment</a></li>
{{/if}}</script>
<script id="menu_file_action_items_template" type="text/x-handlebars-template">{{#feature flag="feature_fix_files"}}
{{else}}
	{{#if actions.share}}
		<li id="share_file" data-file-id="{{file.id}}" role="menuitem"><a>Share</a></li>
	{{else if actions.share_private_file}}
		<li id="share_file" data-file-id="{{file.id}}" role="menuitem"><a>Share</a></li>
	{{/if}}
{{/feature}}

{{#if actions.comment}}
	<li id="comment_file" data-file-id="{{file.id}}" role="menuitem"><a>Comment</a></li>
{{/if}}

{{#if actions.rxn_file}}
	<li id="rxn_file" data-file-id="{{file.id}}" data-rxn-key="{{file._rxn_key}}" role="menuitem"><a>Add a reaction</a></li>
{{/if}}

{{#if actions.pin_file}}
	<li id="pin_file" data-file-id="{{file.id}}" role="menuitem"><a>Pin to {{pinToLabel model_ob}}</a></li>
{{/if}}

{{#if actions.unpin_file}}
	<li id="unpin_file" data-file-id="{{file.id}}" role="menuitem"><a>Un-pin from {{pinToLabel model_ob}}</a></li>
{{/if}}

{{#if actions.print}}
	<li id="print_file" data-file-id="{{file.id}}" role="menuitem"><a>Print</a></li>
{{/if}}

{{#if actions.open_original}}
	<li id="open_original_file" data-file-id="{{file.id}}" role="menuitem">
		<a href="{{file.url_private}}" target="{{file.id}}">
			{{#if_equal file.mode compare="snippet"}}View raw{{else}}Open original{{/if_equal}}
		</a>
	</li>
{{/if}}

{{#if actions.edit}}
	<li class="divider"></li>
	{{#if_equal file.mode compare="snippet"}}
		<li id="edit_file_snippet" data-file-id="{{file.id}}" role="menuitem">
			{{#isClient}}
				<a>Edit</a>
			{{else}}
				<a href="{{file.permalink}}/edit">Edit</a>
			{{/isClient}}
		</li>
	{{/if_equal}}
	{{#if_equal file.mode compare="post"}}
		<li id="edit_file_post" data-file-id="{{file.id}}" role="menuitem">
			<a href="{{file.permalink}}/edit" {{#isClient}}target="{{file.permalink}}/edit"{{/isClient}}>Edit</a>
		</li>
	{{/if_equal}}
	{{#if_equal file.mode compare="space"}}
		<li id="edit_file_space" data-file-id="{{file.id}}" role="menuitem">
			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}/edit"{{/isClient}}>Edit</a>
		</li>
	{{/if_equal}}
{{/if}}

{{#isClient}}
	{{#if actions.edit_title}}
		<li class="divider"></li>
		<li id="edit_file_title" data-file-id="{{file.id}}" role="menuitem">
			{{#isClient}}
				<a>Edit title</a>
			{{else}}
				<a href="{{file.permalink}}/edit">Edit title</a>
			{{/isClient}}
		</li>
	{{/if}}
{{/isClient}}

{{#feature flag="feature_fix_files"}}
	{{#if actions.open_in_flexpane}}
		<li id="open_in_flexpane" data-file-id="{{file.id}}" role="menuitem"><a>View details</a></li>
	{{/if}}
	{{#if actions.open_file_page}}
		<li id="open_file_page" data-file-id="{{file.id}}" role="menuitem"><a href="{{file.permalink}}">Open file page</a></li>
	{{/if}}
	{{#if actions.copy_file_link}}
		<li class="divider"></li>
		<li id="copy_file_link" data-file-id="{{file.id}}" role="menuitem"><a>Copy link</a></li>
	{{/if}}
	{{#if actions.copy_file_link_flash}}
		<li class="divider"></li>
		<li id="copy_file_link_flash" class="hidden" data-file-id="{{file.id}}" data-clipboard-text="{{file.permalink}}" role="menuitem"><a>Copy link</a></li>
	{{/if}}

	{{#if actions.share}}
		{{#unless actions.copy_file_link}}
			{{#unless actions.copy_file_link_flash}}
				<li class="divider"></li>
			{{/unless}}
		{{/unless}}
		<li id="share_file" data-file-id="{{file.id}}" role="menuitem"><a>Share</a></li>
	{{/if}}
	{{#if actions.share_private_file}}
		<li class="divider"></li>
		<li id="share_private_file" data-file-id="{{file.id}}" role="menuitem"><a>Share</a></li>
	{{/if}}
{{/feature}}

{{#if actions.create_public_link}}
	{{! this HBS statement is horrible, TODO: move all this li.divider stuff to a border-top on li#open_file_page + li#create_public_link !}}
	{{#and (if_equal actions.share compare=false) (and (if_equal actions.open_file_page compare=false) (if_equal actions.copy_file_link_flash compare=false))}}
		<li class="divider" data-create-public-link></li>
	{{/and}}
	<li id="create_public_link" data-file-id="{{file.id}}" role="menuitem"><a>Create public link</a></li>
{{/if}}
{{#if actions.revoke_public_link}}
	{{! this HBS statement is horrible, TODO: move all this li.divider stuff to a border-top on li#open_file_page + li#view_public_link/li#revoke_public_link !}}
	{{#and (if_equal actions.share compare=false) (and (if_equal actions.open_file_page compare=false) (if_equal actions.copy_file_link_flash compare=false))}}
		<li class="divider" data-revoke-public-link></li>
	{{/and}}
	{{#if actions.view_public_link}}
		<li id="view_public_link" data-file-id="{{file.id}}" role="menuitem"><a>View public link</a></li>
	{{else}}
		<li id="revoke_public_link" data-file-id="{{file.id}}" role="menuitem"><a>Revoke public link</a></li>
	{{/if}}
{{/if}}

{{#feature flag="feature_channel_details"}}{{#feature flag="feature_files_list"}}
	{{#if info_pane_visible}}
		<li id="star_file" class="star_link star_file {{#if file.is_starred}}starred{{/if}}" data-file-id="{{file.id}}" role="menuitem"><a>{{#if file.is_starred}}Unstar{{else}}Star{{/if}}</a></li>
	{{/if}}
{{/feature}}{{/feature}}

{{#if actions.download}}
	<li id="download_file" data-file-id="{{file.id}}" role="menuitem"><a href="{{file.url_private_download}}" {{#isClient}}target="{{file.id}}"{{/isClient}}>Download</a></li>
{{/if}}

{{#if actions.save_to_dropbox}}
	<li id="save_to_dropbox" data-file-id="{{file.id}}" role="menuitem"><a>Save to Dropbox</a></li>
{{/if}}

{{#if actions.refresh}}
	<li id="refresh_file" data-file-id="{{file.id}}" role="menuitem"><a><span class="item_label">{{#if is_refreshing}}Refreshing...{{else}}Refresh file{{/if}}</span></a></li>
{{/if}}

{{#if actions.delete_file}}
	<li class="divider"></li>
	<li id="delete_file" data-file-id="{{file.id}}" class="danger" role="menuitem"><a>Delete{{#feature flag="feature_fix_files"}} file{{/feature}}{{#if file.is_external}} from Slack{{/if}}</a></li>
{{/if}}</script>
<script id="menu_flexpane_items_template" type="text/x-handlebars-template"><li id="files_user" class="flexpane_menu_item" data-filetype="user" role="menuitem"><a><i class="ts_icon ts_icon_all_files"></i>Your Files</a></li>
<li id="files_all" class="flexpane_menu_item" data-filetype="all" role="menuitem"><a><i class="ts_icon ts_icon_all_files_alt"></i>All Files</a></li>
<li id="list_team" class="flexpane_menu_item" data-tab-id="team" role="menuitem"><a><i class="ts_icon ts_icon_team_directory"></i>Team Directory</a></li>
<li id="help" class="flexpane_menu_item" role="menuitem"><a><i class="ts_icon ts_icon_question_circle"></i>Help <span class="badge candy_red_bg hidden help_icon_circle_count">0</span></a></li>
{{#if show_downloads}}
<li id="downloads" class="flexpane_menu_item" data-tab-id="downloads" role="menuitem"><a><i class="ts_icon ts_icon_cloud_download"></i>Downloads</a><div id="downloads_menu_progress" class="hidden">
	<div class="download_progress_row"><div class="download_progress_bar" style="width:100%"></div></div>
</div></li>
{{/if}}
{{#each special_flex_panes}}
	<li class="flexpane_menu_item" data-tab-id="{{this.flex_name}}" role="menuitem"><a><i class="ts_icon ts_icon_exclamation_circle"></i>{{this.label}}</a></li>
{{/each}}</script>
<script id="menu_channel_picker_header_template" type="text/x-handlebars-template">	<div class="menu_simple_header">
		<h4 class="no_bottom_margin">
			{{#feature flag="feature_private_channels"}}
				Select a channel
			{{else}}
				Select a {{#if channels}}channel {{#if groups}} or{{/if}}{{/if}} {{#if groups}}private group{{/if}}
			{{/feature}}
		</h4>
	</div>
	<div id="channel_picker_filter" class="menu_filter_container">
		<i class="icon_search ts_icon ts_icon_search"></i>		
		<a class="ts_icon ts_icon_times_circle icon_close hidden"></a>
		<input type="text" class="menu_filter no_margin" placeholder="Find by name" />
		<p class="filter_no_matches no_matches hidden subtle_silver">
			Nothing found matching <span class="query bold"></span>.
		</p>
	</div>
</script>
<script id="menu_channel_picker_template" type="text/x-handlebars-template">{{#each channels}}
	<li data-user-id="{{../user_id}}" data-channel-id="{{this.id}}" role="menuitem"><a>{{#feature flag="feature_private_channels"}}<i class="ts_icon ts_icon_channel"></i>{{else}}#{{/feature}}{{this.name}}</a></li>
{{/each}}

{{#each groups}}
	<li data-user-id="{{../user_id}}" data-group-id="{{this.id}}" role="menuitem"><a>{{#feature flag="feature_private_channels"}}<i class="ts_icon ts_icon_lock"></i>{{/feature}}{{this.name}}</a></li>
{{/each}}

{{#each mpims}}
	<li data-user-id="{{../user_id}}" data-mpim-id="{{this.id}}" role="menuitem"><a><i class="ts_icon ts_icon_multiparty_dm_{{mpimMemberCount this}}"></i>{{mpimDisplayName this}}</a></li>
{{/each}}</script>
<script id="menu_search_filter_items_template" type="text/x-handlebars-template"><li class="no_bottom_padding no_wrap" role="menuitem">
	<label for="search_exclude_bots_cb"><input id="search_exclude_bots_cb" type="checkbox" class="small_right_margin" {{#unless search_exclude_bots}}checked="checked"{{/unless}}/>Include {{result_type}} from integrations &amp; bots</label>
</li>
<li class="no_top_padding no_wrap" role="menuitem">
	<label for="search_only_my_channels_cb"><input id="search_only_my_channels_cb" type="checkbox" class="small_right_margin" {{#unless search_only_my_channels}}checked="checked"{{/unless}}/>Include {{result_type}} from channels I don't have open</label>
</li></script>
<script id="mentions_rxn_template" type="text/x-handlebars-template"><div class="mention_rxn" data-ts="{{ts}}">
	<div class="rxn_emoji_icon rxn_{{rxns_to_display.length}}">
		{{#each rxns_to_display}}
			<div class="rxn_emoji">{{{this}}}</div>
		{{/each}}
	</div>
	<span class="mention_rxn_summary">
		<span class="mention_rxn_summary_members">{{{rxn_members}}}</span>
		reacted to your message</span><!--<a class="timestamp no_wrap">{{jump_link}}</a>-->{{{jump_link_html}}}
	<div class="mention_rxn_msg_holder">
		{{{msg_html}}}
	</div>
</div></script>
<script id="rxns_rxn_template" type="text/x-handlebars-template"><span data-emoji="{{name}}" class="emoji_rxn emoji_rxn_real ts_tip ts_tip_top ts_tip_float ts_tip_multiline ts_tip_delay_300 {{css_classes}}" title="{{title}}">
	{{{emoji_html}}}<span class="emoji_rxn_count">{{count}}</span>
</span></script>
<script id="rxns_panel_template" type="text/x-handlebars-template"><div class="rxn_panel {{classesA_css}}" data-rxn-key="{{rxn_key}}">
	{{{rxns_html}}}
	<span class="emoji_rxn_spacer"></span>
	{{#feature flag="feature_new_message_markup"}}{{else}}<nobr>{{/feature}}
		<span class="emoji_rxn menu_rxn">
			<span class="emoji-outer emoji-sizer">
			<i class="ts_icon ts_icon_circle_fill"></i><i class="ts_icon ts_icon_add_reaction"></i>
			</span>
		</span>
	{{#feature flag="feature_new_message_markup"}}{{else}}</nobr>{{/feature}}
</div></script>

<script id="mentions_options_template" type="text/x-handlebars-template">	<div id="advanced_options">
	
		<p class="no_bottom_margin">
			<span id="mentions_filter_menu_label" class="cursor_pointer display_flex align_items_baseline">
				<span class="mentions_filter_menu_target tiny_right_margin bold">Include:</span>
				<span class="flex_one mentions_filter_menu_target tiny_left_margin search_filter_text">{{include_text}} <i class="ts_icon ts_icon_chevron_down bold arrow_down tiny_left_margin"></i></span>
			</span>
		</p>

	</div>
</script>
<script id="mentions_item_template" type="text/x-handlebars-template"><hr class="spacer">
<h3 class="small_bottom_margin">
	{{#if model_ob.is_channel}}
		{{{makeChannelLink model_ob}}}
	{{/if}}
	{{#if model_ob.is_mpim}}
		{{{makeMpimLink model_ob true}}}
	{{else}}
		{{#if model_ob.is_group}}
			{{{makeGroupLink model_ob}}}
		{{/if}}
	{{/if}}
</h3></script>
<script id="menu_mentions_filter_items_template" type="text/x-handlebars-template"><li class="{{#if show_user_group_filter}}no_bottom_padding{{/if}} no_wrap" role="menuitem">
	<label for="exclude_at_channels_cb"><input id="exclude_at_channels_cb" type="checkbox" class="small_right_margin" {{#unless exclude_at_channels}}checked="checked"{{/unless}}/>Include @channel mentions</label>
</li>
{{#if show_user_group_filter}}
	<li class=" no_top_padding no_wrap" role="menuitem">
		<label for="exclude_at_user_groups_cb"><input id="exclude_at_user_groups_cb" type="checkbox" class="small_right_margin" {{#unless exclude_at_user_groups}}checked="checked"{{/unless}}/>Include user group mentions</label>
	</li>
{{/if}}</script>

<script id="star_item_template" type="text/x-handlebars-template">	{{#if_equal star.type compare="channel"}}
		{{{star 'channel' star.channel null}}}
		<strong>{{{makeChannelLinkById star.channel}}}</strong> <span class="star_meta">(channel)</span>
	{{/if_equal}}

	{{#if_equal star.type compare="group"}}
		{{{star 'group' star.channel null}}}
		<strong>{{{makeGroupLinkById star.channel}}}</strong> <span class="star_meta">({{privateGroupCopy}})</span>
	{{/if_equal}}

	{{#if_equal star.type compare="im"}}
		{{{star 'im' star.channel null}}}
		<strong>{{{makeIMLinkById star.channel}}}</strong> <span class="star_meta">(direct message conversation)</span>
	{{/if_equal}}

	{{#if_equal star.type compare="file_comment"}}
		{{#if star.file.is_deleted}}
		{{else}}
			{{#if from_starred_item}}
				<div class="file_comment_item">
					<div class="actions">
						<button class="file_star btn_icon btn btn_outline ts_tip_btn ts_tip ts_tip_top">
							{{{star 'file_comment' star.comment star.file true}}}
							<div class="star_message ts_tip_tip">Star</div>
							<div class="unstar_message ts_tip_tip">Unstar</div>
						</button>
					</div>
					{{{comment_standalone star.comment star.file true}}}
				</div>
			{{else}}
				{{{star 'file_comment' star.comment star.file}}}
				{{{comment_standalone star.comment star.file}}}
			{{/if}}
		{{/if}}
	{{/if_equal}}

</script>

<script id="channel_create_dialog_template" type="text/x-handlebars-template">	<div class="modal-header">
		<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
		{{#if is_edit}}
			<h3>Rename this {{#if is_group}}{{groupCopy}}{{else}}channel{{/if}}</h3>
		{{else}}
			<h3 class="create_header">Create a channel</h3>
		{{/if}}
	</div>
	<div class="modal-body">
		{{#unless is_edit}}
			<p class="no_bottom_margin"><strong>This will create a new public channel that anyone on your team can join.</strong></p>
			{{#unless hide_private_group_option}}
				<p class="mini">If you need this conversation to be private, you should <a onclick="TS.ui.channel_create_dialog.switchToGroup();" class="bold">create a new Private Group instead</a>.</p>
			{{/unless}}
		{{/unless}}
		<p class="top_margin">
			<label for="channel_create_title" class="inline_block">Name</label>
			<input id="channel_create_title" name="title_input" type="text" class="small title_input {{#isWeb}}no_bottom_margin{{/isWeb}}" value="{{title}}" maxlength="{{ChannelNameMaxLength}}" />
			<span class="{{#isWeb}}input_note{{else}}modal_input_note{{/isWeb}}">
				Names must be {{ChannelNameMaxLength}} characters or less, lower case and cannot contain spaces or periods.
			</span>
			<span class="{{#isWeb}}input_note{{else}}modal_input_note alert{{/isWeb}} hidden name_taken_warning">
				<i class="ts_icon ts_icon_warning"></i>
				That name has been taken. Try something different.
			</span>
			<span class="{{#isWeb}}input_note{{else}}modal_input_note alert{{/isWeb}} hidden invalid_chars_warning">
				<i class="ts_icon ts_icon_warning"></i>
				You entered some disallowed characters in the name, which we've fixed. Make sure it looks good to you, and try again!
			</span>
			<span class="{{#isWeb}}input_note{{else}}modal_input_note alert{{/isWeb}} hidden single_punctuation_warning">
				<i class="ts_icon ts_icon_warning"></i>
				Sorry! Names cannot be a single hyphen or underscore.
			</span>
		</p>
		{{#unless is_edit}}
			<p>
				<label for="channel_purpose_input" class="inline_block">
					Purpose{{#isClient}}<br />{{/isClient}}
					<span class="normal">(optional)</span>
				</label>
				<textarea id="channel_purpose_input" name="channel_purpose_input" {{#isWeb}}class="no_bottom_margin"{{/isWeb}} type="text" style="height: 4.5rem;" maxlength="{{ChannelPurposeMaxLength}}">{{purpose}}</textarea>
				<span class="{{#isWeb}}input_note{{else}}modal_input_note{{/isWeb}}">Give your {{#if is_group}}group{{else}}channel{{/if}} a purpose that describes what it will be used for.</span>
			</p>
		{{/unless}}
	</div>
	<div class="modal-footer">
		<a class="btn btn_outline dialog_cancel">Cancel</a>
		{{#if is_edit}}
			{{#if is_group}}
				<button class="btn dialog_go ladda-button" data-style="expand-right"><span class="ladda-label">Rename {{groupCopy caps=true skip_private=true}}</span></button>
			{{else}}
				<button class="btn dialog_go ladda-button" data-style="expand-right"><span class="ladda-label">Rename Channel</span></button>
			{{/if}}
		{{else}}
			<button class="btn dialog_go ladda-button" data-style="expand-right"><span class="ladda-label">Create Channel</span></button>
		{{/if}}
	</div>
</script>
<script id="list_browser_dialog_template" type="text/x-handlebars-template"><div class="modal-header">
	<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
	{{#canUserCreateChannels}}
	<a class="new_channel_btn btn btn_small float_right"><i class="ts_icon ts_icon_plus"></i> New Channel</a>
	{{/canUserCreateChannels}}
	<h3>{{title}}</h3>
</div>
<div class="modal-body">
	
	<div id="list_controls">

		<div id="list_search_container">
			<i class="icon_search ts_icon ts_icon_search"></i>		
			<a class="ts_icon ts_icon_times_circle icon_close"></a>
			<input type="text" class="no_margin" id="list_search" name="list_search" placeholder="Search channels by name" />
		</div>
		
		<div id="list_sort_container">
			<label class="select small">
				<select id="list_sort" name="list_sort" class="small no_top_margin">
					<option value="name" {{#if_equal active_sort compare='name'}}selected='selected'{{/if_equal}}>Channel Name & Membership</option>
					<option value="creator" {{#if_equal active_sort compare='creator'}}selected='selected'{{/if_equal}}>Name of Creator</option>
					<option value="created" {{#if_equal active_sort compare='created'}}selected='selected'{{/if_equal}}>Creation Date (newest first)</option>
					<option value="members_high" {{#if_equal active_sort compare='members_high'}}selected='selected'{{/if_equal}}>Members (most to fewest)</option>
					<option value="members_low" {{#if_equal active_sort compare='members_low'}}selected='selected'{{/if_equal}}>Members (fewest to most)</option>
				</select>
			</label>
		</div>
	</div>
	
	<div id="list_browser">
		<div class="loading_hash_animation"><img src="{{versioned_loading_hash_animation}}" alt="Loading" /><br />loading...</div>
	</div>
	
</div>
<div class="modal-footer">
	<a target="{{newWindowName}}" href="/archives/archived" class="float_right mini"><i class="ts_icon ts_icon_archive"></i> View archived channels...</a>
	<a id="about_channels" class="float_left mini small_left_margin" target="{{newWindowName}}" href="/help/channels"><i class="ts_icon ts_icon_info_circle"></i> About channels...</a>
</div>
</script>
<script id="list_browser_items_template" type="text/x-handlebars-template">	{{#each items}}
		<p class="{{#if this.is_member}}is_member{{else}}joinable{{/if}}">
			<a class="item_open_link item_name" data-item-id="{{this.id}}"><span class='item_icon'>#</span>{{this.name}}</a><br />

			<span class="item_creator">
				Created 
				{{#if this.creator}}
					by {{{makeMemberPreviewLinkById this.creator}}}
				{{/if}}
				on <strong>{{toCalendarDate this.created}}</strong>
			</span>

			<span class="item_count" title="{{this.num_members}} {{pluralize this.num_members 'member' 'members'}} in this channel">
				{{#if this.is_member}}
					<i class="ts_icon ts_icon_check_circle_o ts_icon_inherit"></i>
				{{else}}
					<i class="ts_icon ts_icon_user ts_icon_inherit"></i>
				{{/if}}
				{{this.num_members}}
			</span>
			
			{{#unless this.is_member}}
				<a class="item_open_link item_join_btn btn btn_outline btn_small" data-item-id="{{this.id}}">{{#isUsingArchiveViewer}}Preview{{else}}Join{{/isUsingArchiveViewer}}</a>
			{{/unless}}			

			{{#if this.purpose.value}}
				<span class="item_purpose">{{{formatTopicOrPurpose this.purpose.value}}}</span>
			{{/if}}							
		</p>
	{{/each}}		
</script>
<script id="list_browser_items_by_membership_template" type="text/x-handlebars-template">	{{#if items_to_join}}
		<h4 class="small_bottom_margin">Channels you can join</h4>
		{{#each items_to_join}}
			<p class="joinable">
				<a class="item_open_link item_name" data-item-id="{{this.id}}"><span class='item_icon'>#</span>{{this.name}}</a><br />

				<span class="item_creator">
					Created 
					{{#if this.creator}}
						by {{{makeMemberPreviewLinkById this.creator}}}
					{{/if}}
					on <strong>{{toCalendarDate this.created}}</strong>
				</span>

				<span class="item_count" title="{{this.num_members}} {{pluralize this.num_members 'member' 'members'}} in this channel">
					<i class="ts_icon ts_icon_user ts_icon_inherit"></i>
					{{this.num_members}}
				</span>
			
				<a class="item_open_link item_join_btn btn btn_outline btn_small" data-item-id="{{this.id}}">{{#isUsingArchiveViewer}}Preview{{else}}Join{{/isUsingArchiveViewer}}</a>

				{{#if this.purpose.value}}
					<span class="item_purpose">{{{formatTopicOrPurpose this.purpose.value}}}</span>
				{{/if}}							
			</p>
		{{/each}}		
	{{/if}}
	{{#if items_to_leave}}
		<h4 class="top_margin small_bottom_margin">
			{{#if items_to_join}}
				Channels you belong to
			{{else}}
				You are a member of all current channels
			{{/if}}
		</h4>
		{{#each items_to_leave}}
			<p class="is_member">
				<a class="item_open_link item_name" data-item-id="{{this.id}}"><span class='item_icon'>#</span>{{this.name}}</a><br />

				<span class="item_creator">
					Created 
					{{#if this.creator}}
						by {{{makeMemberPreviewLinkById this.creator}}}
					{{/if}}
					on <strong>{{toCalendarDate this.created}}</strong>
				</span>

				<span class="item_count" title="{{this.num_members}} {{pluralize this.num_members 'member' 'members'}} in this channel">
					<i class="ts_icon ts_icon_check_circle_o ts_icon_inherit"></i>
					{{this.num_members}}
				</span>

				{{#if this.purpose.value}}
					<span class="item_purpose">{{{formatTopicOrPurpose this.purpose.value}}}</span>
				{{/if}}							
			</p>
		{{/each}}
	{{/if}}
</script>
<script id="purpose_dialog_template" type="text/x-handlebars-template">	<div class="modal-header">
		<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
		<h3>{{#if model_ob.purpose.value}}Edit{{else}}Set{{/if}} {{#if is_group}}{{groupCopy skip_private=true}}{{else}}channel{{/if}} purpose</h3>
	</div>
	<div class="modal-body">
		<p>
			<label for="purpose_input" class="inline_block" style="min-width: 6rem; padding-right: 1rem;">
				Purpose<br />
				<span class="normal">(optional)</span>
			</label>
			<textarea id="purpose_input" name="purpose_input" type="text" style="height: 4.5rem;" maxlength="{{ChannelPurposeMaxLength}}" tabindex="1">{{unFormatMessage model_ob.purpose.value}}</textarea>
			<span class="modal_input_note" style="margin-left: 100px;">
				Give your {{#if is_group}}{{groupCopy skip_private=true}}{{else}}channel{{/if}} a purpose that describes what it will be used for.
				{{#if model_ob.purpose.creator}}
					{{#if model_ob.purpose.value}}
						<br />
						The purpose was last set by {{{makeMemberPreviewLinkById model_ob.purpose.creator}}} on {{toCalendarDate model_ob.purpose.last_set}}.
					{{/if}}
				{{/if}}
			</span>
		</p>
	</div>
	<div class="modal-footer">
		<a class="btn btn_outline dialog_cancel" tabindex="3">Cancel</a>
		<a class="btn dialog_go" tabindex="2">Update Purpose</a>
	</div>
</script>
<script id="group_create_template" type="text/x-handlebars-template">	{{#if compliance_exports_enabled_for_team}}
		<p>Messages shared in groups are generally private to the people invited to the group. Note, however, that messages in this group and elsewhere in your team may be accessible to your team owners via <a href="https://slack.zendesk.com/hc/en-us/articles/203950296-FAQs-about-Slack-s-policy-update#complianceexport">Compliance Exports</a>. See <a href="/account/team">Your Team Settings</a> to learn more.</p>
	{{else}}
		<p>A private group is only visible to its members, and only members of a private group can read or search its contents.</p>
	{{/if}}
	<p class="top_margin">
		<label for="title_input" class="inline_block">Name</label>
		<input id="group_create_title" name="title_input" type="text" class="small title_input" value="{{title}}" maxlength="{{ChannelNameMaxLength}}" />
		<span class="modal_input_note" id="title_prompt">
			Names must be lower case and cannot contain spaces or periods.
		</span>
		<span class="modal_input_note hidden alert name_taken_warning">
			That name has been taken. Try something different.
		</span>
		<span class="modal_input_note hidden alert name_missing_warning">
			Enter a title for the group please!
		</span>
		<span class="modal_input_note hidden alert no_invites_warning">
			There's no point in a group with only one member. Invite people!
		</span>
		<span class="modal_input_note hidden alert existing_groups_warning">
			To be filled in by dialog
		</span>
	</p>

	<p>
		<label for="group_purpose_input" class="inline_block">
			Purpose<br />
			<span class="normal">(optional)</span>
		</label>
		<textarea id="group_purpose_input" name="group_purpose_input" type="text" style="height: 3.5rem;" maxlength="{{ChannelPurposeMaxLength}}">{{purpose}}</textarea>
		<span class="modal_input_note">Give your group a purpose that describes what it will be used for.</span>
	</p>
	
	<div id="create_invite_group_members_holder">
		{{#if show_ra_tip}}
			<span class="tiny_bottom_margin modal_input_note">
				Restricted account members may not appear below. Ask a team admin to invite them after you create the group.
			</span>
		{{/if}}
		<p class="no_bottom_margin" id="select_create_invite_group_members_holder">
			<label for="group_members" class="inline_block">Invite Members</label>
			<select multiple="multiple" id="select_create_invite_group_members" name="group_members" size="30">
				{{#each invite_members}}
					<option value="{{this.member.id}}" {{#if this.preselected}}selected="selected"{{/if}}>{{#if this.member.real_name}}{{this.member.real_name}} • {{this.member.name}}{{else}}{{this.member.name}}{{/if}}</option>
				{{/each}}
			</select>		
		</p>
	</div>
</script>

	<script id="prefs_dialog_template" type="text/x-handlebars-template"><div class="modal-header">
	<a class="btn dialog_go btn_small float_right">Done</a>
	<h3>Preferences for {{team_name}}</h3>
</div>
<div class="modal-body">
	
	<div class="modal-nav">
		<a id="prefs_notifications_tab" data-pane-id="prefs_notifications" data-which="notifications" class="active">Notifications</a>
		{{#if show_mac_ssb_prefs}}
			<a id="prefs_mac_ssb_tab" data-pane-id="prefs_mac_ssb" data-which="mac_ssb" class="active">Mac App</a>
		{{/if}}
		{{#if show_win_ssb_prefs}}
			<a id="prefs_win_ssb_tab" data-pane-id="prefs_win_ssb" data-which="win_ssb" class="active">Windows App</a>
		{{/if}}
		{{#if show_lin_ssb_prefs}}
			<!-- NB: The data-which here is not a typo, we wire up binding in one place -->
			<a id="prefs_lin_ssb_tab" data-pane-id="prefs_lin_ssb" data-which="win_ssb" class="active">Linux App</a>
		{{/if}}
		<a id="prefs_messages_tab" data-pane-id="prefs_messages" data-which="messages">Message Display</a>
		<a id="prefs_themes_tab" data-pane-id="prefs_themes" data-which="themes">Sidebar Theme</a>
		<a id="prefs_media_tab" data-pane-id="prefs_media" data-which="media">Media & Links</a>
		<a id="prefs_emoji_tab" data-pane-id="prefs_emoji" data-which="emoji">Emoji{{#if feature_chat_sounds}} & Sounds{{/if}}</a>
		<a id="prefs_search_tab" data-pane-id="prefs_search" data-which="search">Search</a>
		<a id="prefs_read_tab" data-pane-id="prefs_read" data-which="read">Read State Tracking</a>
		<a id="prefs_advanced_tab" data-pane-id="prefs_advanced" data-which="advanced">Advanced Options</a>
		{{#tinyspeck}}
			<a id="prefs_labs_tab" data-pane-id="prefs_labs" data-which="labs">Tiny Speck</a>
		{{/tinyspeck}}
	</div>
	
	{{!---------- NOTIFICATIONS ----------}}
	<div id="prefs_notifications" class="dialog_tab_pane">

		<div class="dialog_tab_pane_scroller">
		
			<div class="growls_stuff" id="growls_permission_div">
				<p class="bold no_bottom_margin"><span class="desktop_notifications_title">Desktop Notifications are currently disabled</span></p>
				<p class="small_bottom_margin">We strongly recommend enabling them.</p>
				<p><a class="btn btn_success" id="growls_permission_link" onclick="TS.ui.prefs_dialog.onGrowlsPermissionLinkClick(); return false;"><i class="ts_icon ts_icon_bell_o small_right_margin"></i> Enable desktop notifications</a></p>
				<p class="mini large_bottom_margin">You can also set <a href="/account/notifications" target="_blank">notification preferences for Email and Mobile</a>.</p>
			</div>
			<div class="growls_stuff" id="growls_instructions_div">
				<p class="bold small_bottom_margin"><span class="desktop_notifications_title">Desktop Notifications</span></p>
				<p class="alert alert_info"><i class="ts_icon ts_icon_info_circle"></i> Your browser should now be presenting you with the option to enable notifications, probably at the top or bottom of this window. Click <strong>Enable</strong> or <strong>Allow</strong> or <strong>Yes</strong> or <strong>OK</strong> or whatever the right button is!</p>
			</div>
			<div class="growls_stuff" id="growls_disallowed_div">
				<p class="bold small_bottom_margin"><span class="desktop_notifications_title">Desktop Notifications are currently disabled</span></p>
				<p class="moscow_red_dark italic small_bottom_margin">You've disallowed notifications in your browser. You'll need to open your browser preferences to change that.</p>
				<p class="mini">You can also set <a href="/account/notifications" target="_blank">notification preferences for Email and Mobile</a>.</p>
			</div>
			<div class="growls_stuff" id="growls_impossible_div">
				<p class="bold small_bottom_margin"><span class="desktop_notifications_title">Desktop Notifications are disabled</span></p>
				<p><i class="ts_icon ts_icon_exclamation_triangle"></i> Your browser does not support desktop notifications. <a href="/apps" target="_blank">Try one of our apps?</a></p>
				<p class="mini">You can also set <a href="/account/notifications" target="_blank">notification preferences for Email and Mobile</a>.</p>
			</div>
			<div class="growls_stuff" id="growls_allowed_div">

				<p class="bold small_bottom_margin">
					<span class="desktop_notifications_title">Desktop Notifications</span>
					<span class="mini helvetica normal left_margin"><a id="growls_test" onclick="TS.sounds.play('new_message'); TS.ui.growls.show('Slack Notification', 'Hey! It works.'); return false;"><i class="ts_icon ts_icon_bell_o_o"></i> Send test notification</a></span>						
				</p>
				<p class="left_margin tiny_bottom_margin">
					<label class="radio no_margin">
						<input name="notifications_rd" type="radio" class="small_right_margin" value="all" /> For activity of any kind
					</label>
					<label class="radio no_margin">
						<input name="notifications_rd" type="radio" class="small_right_margin" value="mentions" /> Only for Highlight Words and direct messages
					</label>
					<label class="radio no_margin">
						<input name="notifications_rd" type="radio" class="small_right_margin" value="never" /> Never
					</label>
				</p>
				
				<p id="no_non_default" class="mini small_bottom_margin">You can override your desktop notification preference on a case-by-case basis for {{channelsAndGroupsCopy}} from the {{channelOrGroupCopy}} menu. Or, <a href="/account/notifications" target="{{newWindowName}}">set notification preferences for email & mobile</a>.</p>
				<p class="non_default hidden mini small_bottom_margin">Some of your {{channelsOrGroupsCopy}} have <strong id="non_default_tip_link" class="cursor_pointer">different notification settings</strong>. Or, <a href="/account/notifications" target="{{newWindowName}}">set notification preferences for email & mobile</a>.</p>
				
				<p class="left_margin small_bottom_margin">
					<label class="checkbox no_margin">
						<input id="no_text_in_notifications_cb" checked="checked" type="checkbox" class="small_right_margin" /> Display message text in desktop notifications
					</label>
				</p>
				
			</div>
			
			<p class="bold no_bottom_margin top_margin">Highlight Words</p>
			<p class="small_bottom_margin">To be notified when someone mentions a word or phrase, add it here. You can separate words or phrases with commas. Highlight Words are not case sensitive.</p>			
			<p>
				<input id="highlight_words_input" type="text" class="small no_bottom_margin full_width" placeholder='{{#if team_prefs.require_at_for_mention}}Include "{{member.name}}" to be notified when you are mentioned without the @{{else}}Your screen name "{{member.name}}" is automatically a Highlight Word{{/if}}' value="{{highlight_words}}" />
			</p>

			<p class="bold no_bottom_margin">
				Notification Sound <span class="normal left_margin"> <label class="checkbox normal inline_block auto_width no_min_width"><input id="mute_sounds_cb" checked="checked" type="checkbox" /> Mute all sounds</label></span>
			</p>
			<p class="no_bottom_margin">
				<label class="select small no_right_padding" id="new_msg_snd_select_label">
					<select id="new_msg_snd_select" class="small no_bottom_margin">
						{{#foreach notification_sounds}}
							<option value="{{value.value}}">{{value.label}}</option>
						{{/foreach}}
					</select>
				</label>
				<button id="soundpreview" class="btn btn_outline small_left_margin"><i class="ts_icon ts_icon_inherit ts_icon_volume_up"></i> Preview</button>
			</p>

		</div>

	</div>

	{{!---------- MESSAGE DISPLAY ----------}}
	<div id="prefs_messages" class="dialog_tab_pane">

		<div class="dialog_tab_pane_scroller">

			<p class="bold no_bottom_margin">Message Theme</p>
			<p class="small_bottom_margin">The theme you choose defines the look and feel of messages in Slack.</p>
			<p class="left_margin">
				<label class="radio small_bottom_margin">
					<input name="messages_theme_select" type="radio" class="small_right_margin" value="light_with_avatars" /> Clean: <span class='normal'>Clear, friendly, and focused.</span>
				</label>
				<label class="radio no_margin">
					<input name="messages_theme_select" type="radio" class="small_right_margin" value="dense" /> Compact: <span class='normal'>The most messages you can fit on screen at once.</span>
				</label>
			</p>

			<p class="bold no_bottom_margin">Message Options</p>
			<p class="small_bottom_margin">Customize how Slack shows activity, names, and times.</p>
			<p class="left_margin small_bottom_margin">
				<label class="checkbox no_margin">
					<input id="show_typing_cb" checked="checked" type="checkbox" class="small_right_margin" /> Display information about who is currently typing a message
				</label>
			</p>
			<p class="left_margin small_bottom_margin">
				<label class="checkbox no_margin">
					<input id="display_real_names_override_cb" checked="checked" type="checkbox" class="small_right_margin" /> Display real names <span id="display_real_names_default">(team default)</span> instead of usernames <span id="display_usernames_default">(team default)</span>
				</label>
			</p>
			<p class="left_margin">
				<label class="checkbox no_margin">
					<input id="time24_cb" checked="checked" type="checkbox" class="small_right_margin" /> Show times with 24-hour clock <span class="normal">(16:00 rather than 4:00PM)</span>
				</label>
			</p>

			<p class="bold no_bottom_margin">Font Options</p>
			<p class="no_bottom_margin left_margin">
				<label class="checkbox no_margin">
					<input id="load_lato_2_cb" checked="checked" type="checkbox" class="small_right_margin" /> Use Lato 2.0 <span class="normal">(includes <a href="http://www.latofonts.com/2014/02/27/lato-2-0-released/" target="{{newWindowName}}">extended latin character set</a>)</span><br />
					<span class="normal">If you use a language with accented characters, this will improve font appearance. Requires reload to take effect.</span>
				</label>
			</p>

		</div>

	</div>

	{{!---------- SIDEBAR THEME ----------}}
	<div id="prefs_themes" class="dialog_tab_pane">

		<div class="dialog_tab_pane_scroller">

			<p class="bold no_bottom_margin">Sidebar Theme</p>
			<p class="no_bottom_margin">Set a sidebar theme for yourself on the <strong>{{team_name}}</strong> team. Only you will see this.</p>
			<label class="radio theme_label">
				<img src="{{versioned_theme_thumb_default}}" class="theme_thumb" /><br />
				<input name="sidebar_theme_rd" type="radio" value="default_theme" /> Aubergine
			</label>
			<label class="radio theme_label">
				<img src="{{versioned_theme_thumb_hoth}}" class="theme_thumb" /><br />
				<input name="sidebar_theme_rd" type="radio" value="hoth_theme" /> Hoth
			</label>
			<label class="radio theme_label">
				<img src="{{versioned_theme_thumb_monument}}" class="theme_thumb" /><br />
				<input name="sidebar_theme_rd" type="radio" value="monument_theme" /> Monument
			</label>
			<label class="radio theme_label">
				<img src="{{versioned_theme_thumb_chocolate}}" class="theme_thumb" /><br />
				<input name="sidebar_theme_rd" type="radio" value="chocolate_theme" /> Choco Mint
			</label>
			<label class="radio theme_label">
				<img src="{{versioned_theme_thumb_ocean}}" class="theme_thumb" /><br />
				<input name="sidebar_theme_rd" type="radio" value="ocean_theme" /> Ochin
			</label>
			<label class="radio theme_label">
				<img src="{{versioned_theme_thumb_workhard}}" class="theme_thumb" /><br />
				<input name="sidebar_theme_rd" type="radio" value="workhard_theme" /> Work Hard
			</label>

			<p id="customize_theme_info" class="clear_both mini {{#if show_customization_ui}}hidden{{/if}}"><i class="ts_icon ts_icon_bolt ts_icon_inherit small_right_margin"></i> Feeling adventurous? You can <a id="customize_theme_toggle" class="bold">customize your theme and share it with others</a>.

			<div id="prefs_themes_customize" class="clear_both {{#unless show_customization_ui}}hidden{{/unless}}">
				<p class="bold clear_both small_bottom_margin">Custom Theme</p>

				<div class="input-prepend">
					<span class="add-on color_swatch" data-theme-element='column_bg' data-hex='{{theme.column_bg}}' style="background-color: {{theme.column_bg}};"></span>
					<input type="text" name="color_column_bg_hex" class="small color_hex monospace" value="{{theme.column_bg}}" maxlength="7" /><br />
					<span class="input_note">Column BG</span>
				</div>

				<div class="input-prepend">
					<span class="add-on color_swatch" data-theme-element='menu_bg' data-hex='{{theme.menu_bg}}' style="background-color: {{theme.menu_bg}};"></span>
					<input type="text" name="color_menu_bg_hex" class="small color_hex monospace" value="{{theme.menu_bg}}" maxlength="7" /><br />
					<span class="input_note">Menu BG Hover</span>
				</div>

				<div class="input-prepend">
					<span class="add-on color_swatch" data-theme-element='active_item' data-hex='{{theme.active_item}}' style="background-color: {{theme.active_item}};"></span>
					<input type="text" name="color_active_item_hex" class="small color_hex monospace" value="{{theme.active_item}}" maxlength="7" /><br />
					<span class="input_note">Active Item</span>
				</div>

				<div class="input-prepend">
					<span class="add-on color_swatch" data-theme-element='active_item_text' data-hex='{{theme.active_item_text}}' style="background-color: {{theme.active_item_text}};"></span>
					<input type="text" name="color_active_item_text_hex" class="small color_hex monospace" value="{{theme.active_item_text}}" maxlength="7" /><br />
					<span class="input_note">Active Item Text</span>
				</div>

				<div class="input-prepend">
					<span class="add-on color_swatch" data-theme-element='hover_item' data-hex='{{theme.hover_item}}' style="background-color: {{theme.hover_item}};"></span>
					<input type="text" name="color_hover_item_hex" class="small color_hex monospace" value="{{theme.hover_item}}" maxlength="7" /><br />
					<span class="input_note">Hover Item</span>
				</div>

				<div class="input-prepend">
					<span class="add-on color_swatch" data-theme-element='text_color' data-hex='{{theme.text_color}}' style="background-color: {{theme.text_color}};"></span>
					<input type="text" name="color_text_color_hex" class="small color_hex monospace" value="{{theme.text_color}}" maxlength="7" /><br />
					<span class="input_note">Text Color</span>
				</div>

				<div class="input-prepend">
					<span class="add-on color_swatch" data-theme-element='active_presence' data-hex='{{theme.active_presence}}' style="background-color: {{theme.active_presence}};"></span>
					<input type="text" name="color_active_presence_hex" class="small color_hex monospace" value="{{theme.active_presence}}" maxlength="7" /><br />
					<span class="input_note">Active Presence</span>
				</div>

				<div class="input-prepend">
					<span class="add-on color_swatch" data-theme-element='badge' data-hex='{{theme.badge}}' style="background-color: {{theme.badge}};"></span>
					<input type="text" name="color_badge_hex" class="small color_hex monospace" value="{{theme.badge}}" maxlength="7" /><br />
					<span class="input_note">Mention Badge</span>
				</div>

				<input type="text" name="sidebar_theme_custom" id="sidebar_theme_custom" class="monospace subtle_silver top_margin" />
				<p class="input_note no_bottom_margin">Copy and paste these values to share your custom theme with others.</p>
			</div>

		</div>

	</div>


	{{!---------- MEDIA & LINKS ----------}}
	<div id="prefs_media" class="dialog_tab_pane">

		<div class="dialog_tab_pane_scroller">

			<p class="bold no_bottom_margin">Inline Media Display</p>
			<p class="small_bottom_margin">Expand references to images, video, and audio to preview them inline:</p>
			<p class="small_bottom_margin left_margin">
				<label class="checkbox no_margin">
					<input id="expand_internal_inline_imgs_cb" checked="checked" type="checkbox" class="small_right_margin" /> For files on Slack
				</label>
			</p>
			<p class="left_margin small_bottom_margin">
				<label class="checkbox no_margin">
					<input id="expand_inline_imgs_cb" checked="checked" type="checkbox" class="small_right_margin" /> For links to media from external sources
				</label>
			</p>
			<p class="large_left_margin" id="dont_obey_inline_img_limit_p">
				<label class="checkbox no_margin">
					<input id="dont_obey_inline_img_limit_cb" checked="checked" type="checkbox" class="small_right_margin" /> Even if it is an image larger than {{convertFilesize inline_img_byte_limit}}
				</label>
			</p>
			
			<p class="bold small_bottom_margin large_top_margin">Link Expansion</p>
			<p class="no_bottom_margin left_margin">
				<label class="checkbox no_margin">
					<input id="expand_non_media_attachments_cb" checked="checked" type="checkbox" class="small_right_margin" /> Expand website links to show a preview of the content, when available.
				</label>
			</p>

		</div>

	</div>

	{{!---------- EMOJI & SOUNDS----------}}
	<div id="prefs_emoji" class="dialog_tab_pane">

		<div class="dialog_tab_pane_scroller">

			<p class="bold no_bottom_margin">Emoji Style</p>
			<p class="small_bottom_margin">How do you like your emoji?</p>
			<p class="left_margin">
				<label class="radio small_bottom_margin">
					<input name="emoji_mode_select" type="radio" class="small_right_margin" value="default" /> 
					<span class="emoji_label">Apple/International Style</span>
					<img src="{{versioned_emoji_apple_style}}" class="emoji_preview" />
				</label>
				<label class="radio small_bottom_margin">
					<input name="emoji_mode_select" type="radio" class="small_right_margin" value="google" /> 
					<span class="emoji_label">Google Hangouts Style</span>
					<img src="{{versioned_emoji_google_style}}" class="emoji_preview" />
				</label>
				<label class="radio small_bottom_margin">
					<input name="emoji_mode_select" type="radio" class="small_right_margin" value="twitter" /> 
					<span class="emoji_label">Twitter Style</span>
					<img src="{{versioned_emoji_twitter_style}}" class="emoji_preview" />
				</label>
				<label class="radio small_bottom_margin">
					<input name="emoji_mode_select" type="radio" class="small_right_margin" value="emojione" /> 
					<span class="emoji_label">Emoji One Style</span>
					<img src="{{versioned_emoji_emojione_style}}" class="emoji_preview" />
				</label>
				<label class="radio no_margin">
					<input name="emoji_mode_select" type="radio" class="small_right_margin" value="as_text" /> None: <span class="normal">plain text only</span></span>
				</label>
			</p>
			
			<p class="bold small_bottom_margin large_top_margin">Emoticons</p>
			<p class="left_margin">
				<label class="checkbox no_margin">
					<input id="convert_emoticons_cb" checked="checked" type="checkbox" class="small_right_margin" /> Convert my typed emoticons to emoji, so &nbsp;:D&nbsp; becomes {{{emojiGraphicReplace ":smile:"}}}
				</label>
			</p>

			{{#if feature_chat_sounds}}
			<p class="bold small_bottom_margin">Chat Sounds</p>
			<p class="left_margin">
				<label class="checkbox no_margin">
					<input id="autoplay_chat_sounds_cb" checked="checked" type="checkbox" class="small_right_margin" /> Automatically play sounds that are used in chat
				</label>
			</p>
			{{/if}}

		</div>

	</div>

	{{!---------- OS X ----------}}
	{{#if show_mac_ssb_prefs}}
		<div id="prefs_mac_ssb" class="dialog_tab_pane">

			<div class="dialog_tab_pane_scroller">
		
				<p class="bold no_bottom_margin">Mac App Dock Icon Settings</p>
				<p class="small_bottom_margin">These settings define how the dock icon behaves in the OS X app.</p>
				<p class="small_bottom_margin">
					<label class="checkbox no_margin left_margin">
						<input id="mac_ssb_bullet_cb" checked="checked" type="checkbox" class="small_right_margin" /> Use a (•) symbol on the app icon to indicate when there is unread activity
					</label>
				</p>
				<p>
					<label class="checkbox small_bottom_margin left_margin">
						<input id="mac_ssb_bounce_cb" checked="checked" type="checkbox" class="small_right_margin" /> Bounce the app dock icon when showing a notification
					</label>
					<label class="checkbox no_margin large_left_margin">
						<input id="mac_ssb_bounce_short_cb" checked="checked" type="checkbox" class="small_right_margin" /> Bounce it just once
					</label>
				</p>
				
				
				{{#tinyspeck}}
				{{#supportsSpeech}}
				<p class="bold no_bottom_margin">Mac App Voice Settings [TS only]</p>
				<p class="small_bottom_margin">Enable this if want notifications spoken to you.</p>
				<p class="small_bottom_margin">
					<label class="checkbox no_margin">
						<input id="speak_growls_cb" checked="checked" type="checkbox" class="small_right_margin" /> Speak growls
					</label>
				</p>
				<p class="small_bottom_margin">
					voice: <select id="mac_speak_voice_select">
						{{#each speak_voices}}
							<option value="{{this.value}}">{{this.label}}</option>
						{{/each}}
					</select>
				</p>
				<p class="small_bottom_margin">
					speed: <select id="mac_speak_speed_select">
						{{#each speak_speeds}}
							<option value="{{this}}">{{this}}</option>
						{{/each}}
					</select>
				</p>
				<p class="small_bottom_margin">
					<button id="mac_speak_test" type="button" class="btn btn_small">test</button>
				</p>
				
				{{/supportsSpeech}}
				{{/tinyspeck}}

			</div>

		</div>
	{{/if}}

	{{!---------- WIN ----------}}
	{{#if show_win_ssb_prefs}}
		<div id="prefs_win_ssb" class="dialog_tab_pane">

			<div class="dialog_tab_pane_scroller">

				<p class="bold small_bottom_margin">App Settings</p>
				
				<p class="tiny_bottom_margin">
					<label class="checkbox no_margin left_margin">
						<input id="winssb_launch_on_start_cb" checked="checked" type="checkbox" class="small_right_margin" /> Launch app on login
					</label>
				</p>
				
				<p class="tiny_bottom_margin">
					<label class="checkbox no_margin left_margin">
						<input id="winssb_run_from_tray_cb" checked="checked" type="checkbox" class="small_right_margin" /> Leave app running in notification area when the window is closed
					</label>
				</p>
				
				<p id="winssb_disable_hw_acceleration_pref" class="small_bottom_margin">
					<label class="checkbox no_margin left_margin">
						<input id="winssb_disable_hw_acceleration_cb" checked="unchecked" type="checkbox" class="small_right_margin" /> Disable hardware acceleration
						<p id="winssb_disable_hw_acceleration_note" class="mini left_margin">If you use a Windows Classic theme, this can resolve rendering issues. Restart Slack for this preference to take effect.</p>
					</label>
				</p>

				<p id="winssb_notify_prefs_heading" class="bold top_margin small_bottom_margin">App Notification Settings</p>
				
				<p id="winssb_flash_window_heading" class="normal tiny_bottom_margin">When a notification is received, flash the window:</p>
				
				<p id="winssb_flash_window_choices" class="left_margin small_bottom_margin">
					<label class="radio no_margin">
						<input name="winssb_flash_window_rd" type="radio" class="small_right_margin" value="never"/> Never
					</label>
					<label class="radio no_margin">
						<input name="winssb_flash_window_rd" type="radio" class="small_right_margin" value="idle"/> When left idle<span class='normal'> (inactive for at least 10 seconds)</span>
					</label>
					<label class="radio no_margin">
						<input name="winssb_flash_window_rd" type="radio" class="small_right_margin" value="always"/> Always
					</label>
				</p>
				
				<p id="winssb_notify_position" class="top_margin small_bottom_margin">
					<label class="select small col span_1_of_2 align_left" style="width: 49%">
						Display notifications on the 
						<select id="winssb_notify_corner" class="small" style="margin-bottom: 4px;">
							<option value="bottom_right">bottom-right</option>
							<option value="top_right">top-right</option>
							<option value="top_left">top-left</option>
							<option value="bottom_left">bottom-left</option>
						</select>
					</label>
					<label class="select small col span_1_of_2 align_left" style="width: 49%">
						corner of the
						<select id="winssb_notify_display" class="small" style="margin-bottom: 4px;">
							<option value="same_as_app">same display as app</option>
							<option value="primary">primary display</option>
						</select>
					</label>
				</p>

			</div>
		</div>
	{{/if}}
	
	{{!---------- LINUX ----------}}
	{{#if show_lin_ssb_prefs}}
		<div id="prefs_lin_ssb" class="dialog_tab_pane">

			<div class="dialog_tab_pane_scroller">

				<p class="bold small_bottom_margin">App Settings</p>
				
				<p class="small_bottom_margin">
					<label class="checkbox no_margin left_margin">
						<input id="winssb_launch_on_start_cb" checked="checked" type="checkbox" class="small_right_margin" /> Launch app on login
					</label>
				</p>
				
				<p class="small_bottom_margin">
					<label class="checkbox no_margin left_margin">
						<input id="winssb_run_from_tray_cb" checked="checked" type="checkbox" class="small_right_margin" /> Leave app running in notification area when the window is closed
					</label>
				</p>

			</div>
		</div>
	{{/if}}

	{{!---------- SEARCH ----------}}
	<div id="prefs_search" class="dialog_tab_pane">

		<div class="dialog_tab_pane_scroller">

			<p class="bold no_bottom_margin">Search Exclusion</p>
			<p>By default, channels you do not have open are excluded from your search results. (You can change this using the <strong>Include</strong> options any time you do a search.) Add channels to the list below that you would <strong>always</strong> like to exclude from search.</p>
			<p class="small_bottom_margin bold">Always hide results from these channels when searching messages:</p>
			<p class="small_bottom_margin">
				<select multiple="multiple" id="search_channel_exclusion" size="30">
					<optgroup label="Active Channels">
						{{#each active_channels}}
							<option value="{{this.channel.id}}"{{#if this.search_channel_exclusion}} selected{{/if}}>#{{this.channel.name}}</option>
						{{/each}}
					</optgroup>
					<optgroup label="Archived Channels">
						{{#each archived_channels}}
							<option value="{{this.channel.id}}"{{#if this.search_channel_exclusion}} selected{{/if}}>#{{this.channel.name}}</option>
						{{/each}}
					</optgroup>
				</select>
			</p>

		</div>

	</div>

	{{!---------- READ MARKING ----------}}
	<div id="prefs_read" class="dialog_tab_pane">

		<div class="dialog_tab_pane_scroller">

			<p class="bold no_bottom_margin">Marking Messages as Read</p>
			<p>By default, Slack marks messages as read as soon as you view the {{channelDmOrGroupCopy}}. You can adjust this behavior if you like:</p>
			<p class="small_left_margin">
				<label class="radio no_margin small_bottom_margin">
					<input name="read_rd" type="radio" class="small_right_margin" value="immediate_scroll" style="margin-left: -24px;" />
					Default: automatically scroll me to the oldest unread message and mark the channel as having been read.
				</label>
				<label class="radio no_margin small_bottom_margin">
					<input name="read_rd" type="radio" class="small_right_margin" value="immediate" style="margin-left: -24px;" />
					Do not scroll me to the oldest unread message, but still mark the messages as having been read when I switch.
				</label>
				<label class="radio no_margin small_bottom_margin">
					<input name="read_rd" type="radio" class="small_right_margin" value="default" style="margin-left: -24px;" />
					Do not scroll me or automatically mark messages as read — wait until I've seen the oldest unread message.
				</label>
			</p>
			<p id="read_tips" class="no_bottom_margin"><b>Tips</b>: :raising_hand: Need to come back to something? You can set your own unread-point by holding down [opt/alt] and clicking on a message. :information_desk_person: You can also mark a {{channelDmOrGroupCopy}} as read by hitting the Esc key while viewing it. :ok_woman: Holding down shift while pressing the Esc key will mark everything in Slack as read (use sparingly).</p>

		</div>

	</div>
	
	{{!---------- ADVANCED OPTIONS ----------}}
	<div id="prefs_advanced" class="dialog_tab_pane">

		<div class="dialog_tab_pane_scroller">

			<p class="bold no_bottom_margin">Input Options</p>
			<p class="tiny_bottom_margin">
				<label class="checkbox no_margin">
					<input id="webapp_spellcheck_cb" checked="checked" type="checkbox" class="small_right_margin" /> Enable spellchecking on input fields.
				</label>
			</p>
			<p class="tiny_bottom_margin">
				<label class="checkbox no_margin">
					<input id="require_at_cb" checked="checked" type="checkbox" class="small_right_margin" /> Only show autocomplete for people when the '@' character is used.
				</label>
			</p>
			<p class="tiny_bottom_margin">
				<label class="checkbox no_margin">
					<input id="enter_is_special_in_tbt_cb" checked="checked" type="checkbox" class="small_right_margin" /> When typing code with ```, ENTER should not send the message. <span id="enter_is_special_in_tbt_tip" title="Unless you hold down SHIFT">*</span>
				</label>
			</p>
			<p style="margin-bottom: .5rem;">
				<label class="checkbox no_margin">
					<input id="arrow_history_cb" checked="checked" type="checkbox" class="small_right_margin" /> Up/Down arrows in input cycle through your typed history. <span class="normal">With this checked, you'll have to use {{#isMac}}Cmd{{else}}Ctrl{{/isMac}} + <i class="ts_icon ts_icon_square_arrow_up ts_icon_inherit"></i>&nbsp;&nbsp;to edit your last message.</span>
				</label>
			</p>
			
			<p class="bold no_bottom_margin">Channel List</p>
			<p>
				<label id="sidebar_behavior_select_label" class="select small full_width">
					<select id="sidebar_behavior_select" class="small">
						<option value="">Show all {{channelsDmsAndPrivateGroupsCopy}} you have open (default)</option>
						{{#tinyspeck}}<option value="shrink_left_column">(TS only) Show all {{channelsDmsAndPrivateGroupsCopy}} you have open, but real tiny</option>{{/tinyspeck}}
						<option value="hide_read_channels">Hide any {{channelsDmsOrGroupsCopy}} which have no unread activity</option>
						<option value="hide_read_channels_unless_starred">Hide any channels, etc., which have no unread activity, unless they are starred</option>
					</select>
				</label>
			</p>
			
			<p class="bold no_bottom_margin">Other Options</p>
			<p class="tiny_bottom_margin">
				<label class="checkbox no_margin">
					<input id="pagekeys_handled_cb" checked="checked" type="checkbox" class="small_right_margin" /> Page up/down, Home, and End keys always scroll messages.
				</label>
			</p>
			{{#isOurApp}}{{else}}
			<p class="tiny_bottom_margin">
				<label class="checkbox no_margin">
					<input id="f_key_search_cb" checked="checked" type="checkbox" class="small_right_margin" /> {{#isMac}}Cmd{{else}}Ctrl{{/isMac}} + F starts a Slack search. <span class="normal">Overrides normal browser search behavior.</span>
				</label>
			</p>
			<p class="tiny_bottom_margin">
				<label class="checkbox no_margin">
					<input id="k_key_omnibox_cb" checked="checked" type="checkbox" class="small_right_margin" /> {{#isMac}}Cmd{{else}}Ctrl{{/isMac}} + K starts the quick switcher. <span class="normal">Overrides normal behavior in some browsers.</span>
				</label>
			</p>
			{{/isOurApp}}
			<p class="tiny_bottom_margin">
				<label class="checkbox no_margin">
					<input id="no_omnibox_in_channels_cb" checked="checked" type="checkbox" class="small_right_margin" /> Hide the quick switcher in the channel list.
				</label>
			</p>
			<p class="tiny_bottom_margin">
				<label class="checkbox no_margin">
					<input id="ask_after_away_cb" checked="checked" type="checkbox" class="small_right_margin" /> Ask if I want to toggle my away status when I log in after having set myself away.
				</label>
			</p>
			<p style="margin-bottom: .5rem;">
				<label class="checkbox no_margin">
					<input id="surprise_me" type="checkbox" class="small_right_margin" /> Surprise me!
				</label>
			</p>
			<div id="surprise" style="display: none;">
				<img id="emo_bear" src="" style="width: 279px; height: 243;"/><br />
				<h1 class="candy_red">Surprise!</h1>
			</div>

			<p class="normal">You might also want to change some <a onclick="TS.ui.prefs_dialog.switchToDebuggingPrefs()" class="bold">debugging preferences</a>.

		</div>

	</div>
	
	{{#tinyspeck}}{{>prefs_internal}}{{/tinyspeck}}

</div>
</script>
		<script id="prefs_internal_template" type="text/x-handlebars-template">{{! this file intentionally left blank }}
</script>

<script id="help_dialog_template" type="text/x-handlebars-template"><div class="modal-header with_tabs">
	<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
	<h3 class="no_tabs_title hidden">Help</h3>
	<div class="dialog_tabs {{#isChrome}}chrome_fix{{/isChrome}}">
		<a id="help_docs_tab" data-pane-id="help_docs" data-which="docs">Help Topics</a>
		<a id="help_issues_tab" data-pane-id="help_issues" data-which="issues">Help Requests</a>
	</div>
</div>
<div class="modal-body">
	<div id="help_docs" class="dialog_tab_pane">
		<div id="help_docs_scroller">
			<p id="no_open_issues" class="hidden">
				No open requests. <a href="/help" target="_blank" class="bold">View your help request history</a>.
			</p>
			
			<p id="unread_issues" class="hidden">
				<span id="unread_issues_many" class="hidden">
					<a href="/help" target="_blank" class="bold"><span class="badge candy_red_bg" id="unread_issues_count_txt"></span>&nbsp; You have new replies to your help requests.</a>
				</span>
				<span id="unread_issues_singular" class="hidden">
					<a href="/help" target="_blank" class="bold"><span class="badge candy_red_bg">1</span>&nbsp; You have a new reply to your help request.</a>
				</span>
			</p>
			
			<p id="open_issues" class="hidden bottom_margin">
				<span id="open_issues_many" class="hidden">
					<a href="/help" target="_blank" class="bold"><span class="badge havana_blue_bg" id="open_issues_count_txt"></span>&nbsp; You have open help requests.</a>
				</span>
				<span id="open_issues_singular" class="hidden">
					<a href="/help" target="_blank" class="bold"><span class="badge havana_blue_bg">1</span>&nbsp; You have an open help request.</a>
				</span>
			</p>
			
			<hr id="help_divider" />
			
			<div id="docs_list">
				<p>Here's a quick list of popular help topics:
				<ul class="bold">
					<li><a href="https://slack.zendesk.com/hc/en-us/articles/201330256" target="_blank">Inviting new members to your Slack team</a></li>
					<li><a href="https://slack.zendesk.com/hc/en-us/articles/201925108" target="_blank">Understanding channels, {{privateGroupsCopy}} & direct messages</a></li>
					<li><a href="https://slack.zendesk.com/hc/en-us/articles/201405046" target="_blank">Joining multiple Slack teams</a></li>
					<li><a href="https://slack.zendesk.com/hc/en-us/articles/202288908" target="_blank">Formatting your messages</a></li>						
					<li><a href="https://slack.zendesk.com/hc/en-us/articles/201375146" target="_blank">Leaving, archiving, or deleting a channel</a></li>
				</ul>
				
				<p><a onclick="TS.help_dialog.cancel(); TS.ui.shortcuts_dialog.start();" class="bold">View all Keyboard Shortcuts</a>. Or, <a href="https://slack.zendesk.com/hc" target="_blank" class="bold">see all help topics...</a></p>

				<form action="https://slack.zendesk.com/hc/en-us/search" target="_blank" onsubmit="if (!$('#zd_search_input').val()) return false;setTimeout(function(){$('#zd_search_input').val('')}, 100)">
					<input type="text" id="zd_search_input" name="query" class="small small_right_margin" placeholder="Search all help topics..."/>
					<button type="submit" class="btn">Search</button>
				</form>

				<p id="cant_find" style="font-size: 1.2rem;" class="small_bottom_margin">
					Don't see what you're looking for? <a class="bold" href="/help/requests/new" target="_blank">Send us a help request.</a>
				</p>
			</div>
		</div>
	</div>
	
	<div id="help_issues" class="dialog_tab_pane">
		<div id="help_issues_scroller">
			<div style="margin-right:1rem">
				<div id="help_issues_list">
					{{#if issue_list_html}}
						{{{issue_list_html}}}
					{{else}}
						<div id="help_issues_list_empty">
							<i class="ts_icon ts_icon_check_circle_o"></i> <strong>You have no current requests.</strong><br />
							If you're having problems, you can <a href="/help/requests/new" target="{{newWindowName}}" class="bold">open a new request</a>. 
						</div>
					{{/if}}
				</div>
				
				<div id="help_issue_div">
				
				</div>
				
				<div id="help_issue_new_form_div">
					<p class="">
						We want your input: question, bug reports, complaints, praise, feature requests – every bit helps. Let us know what we can do to improve Slack.
					</p>
					<p class="small_bottom_margin">
						<input type="text" id="issue_new_title" maxlength="{{max_title_chars}}" style="width: 99.5%;" placeholder="Subject (optional)">
					</p>
					<p>
						<textarea id="issue_new_text" wrap="virtual" style="width: 99.5%; height:230px"></textarea>
						<span class="mini float_left cloud_silver">cmd+enter to submit</span>
					</p>
				</div>
				
				<div id="help_issue_reply_form_div">
					<p class="">
						Reply to <a id="issue_reply_title"></a>
					</p>
					<p>
						<textarea id="issue_reply_text" wrap="virtual" style="width: 99.5%; height:230px"></textarea>
						<span class="mini float_left cloud_silver">cmd+enter to submit</span>
					</p>
					<div id="issue_reply_footer" class="large_top_margin"></div>
				</div>
			
			</div>
		</div>
		<div id="issues_overlaid_throbber" class="loading_hash_animation"><img src="{{versioned_loading_hash_animation}}" alt="Loading" /><br />working...</div>
	</div>

</div>
<div class="modal-footer hidden">

	<div id="help_issues_list_btns">
		{{#if more_url}}<a id="previous_issues" class="float_left mini small_left_margin" href="{{more_url}}" target="_blank"><i class="ts_icon ts_icon_info_circle"></i>Previous issues...</a>{{/if}}
		<a id="new_issue_btn" class="btn disable_when_working dialog_go">Open New Request</a>
	</div>
	<div id="help_issue_btns">
		<a id="issue_resolved_btn" class="btn disable_when_working btn_success float_left small_left_margin">Mark as Resolved</a>
		<a id="issue_back_btn" class="btn btn_outline">Back</a>
		<a id="issue_reply_btn" class="btn disable_when_working dialog_go">Add Reply</a>
	</div>
	<div id="help_issue_new_form_btns">
		<a id="new_issue_cancel_btn" class="btn disable_when_working btn_outline">Cancel</a>
		<a id="new_issue_submit_btn" class="btn disable_when_working dialog_go">Submit Request</a>
	</div>
	<div id="help_issue_reply_form_btns">
		<a id="issue_reply_cancel_btn" class="btn disable_when_working btn_outline">Cancel</a>
		<a id="issue_reply_submit_btn" class="btn disable_when_working dialog_go">Submit Reply</a>
	</div>

</div>
</script>
<script id="channel_prefs_dialog_template" type="text/x-handlebars-template"><div class="modal-header">
	<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
	<h3>Notification Preferences: {{display_name}}</h3>
</div>
<div class="modal-body feature_muting">

	<div id="notifications_not_working" class="hidden">
		<p class="bold small_bottom_margin"><i class="ts_icon ts_icon_laptop ts_icon_inherit small_right_margin" style="margin-left: 0.4rem; width: 1rem"></i> Desktop notifications</p>
		<p class="highlight_yellow_bg">
			<span id="notifications_not_yet_allowed" class="hidden">You have not yet allowed desktop notifications. Open the <a onclick="TS.ui.channel_prefs_dialog.showMainPrefs('notifications')" class="cursor_pointer bold">Preferences Dialog</a> and follow the instructions to set them up.</span>
			<span id="notifications_not_enabled" class="hidden">You've disabled desktop notifications. Open the <a onclick="TS.ui.channel_prefs_dialog.showMainPrefs('notifications')" class="cursor_pointer bold">Preferences Dialog</a> to change that.</span>
			<span id="notifications_not_allowed" class="hidden">You've disallowed notifications in your browser. You'll need to open your browser preferences to change that.</span>
			<span id="notifications_impossible" class="hidden">Your browser does not support desktop notifications. <a href="/apps" target="_blank">Try one of our apps?</a></span>
		</p>
	</div>

	<div id="non_muting_prefs" {{#if is_muted}}style="display: none;"{{/if}}>

		<div id="notifications_working" class="hidden">
			<p class="bold small_bottom_margin"><i class="ts_icon ts_icon_laptop ts_icon_inherit small_right_margin" style="margin-left: 0.4rem; width: 1rem"></i> Desktop notifications</p>
			<p class="small_left_margin">
				<label class="radio no_margin normal">
					<input name="channel_loud_rd" type="radio" class="small_right_margin" value="everything" /> Activity of any kind <span id="all_everything_default" class="bold">(default)</span>
				</label>
				<label class="radio no_margin normal">
					<input name="channel_loud_rd" type="radio" class="small_right_margin" value="mentions" /> Mentions of my name or highlight words <span id="all_mentions_default" class="bold">(default)</span>
				</label>

				{{#if show_two_suppressed_cbs}}
					<span id="suppressed_span" class="large_left_margin inline_block">
					<label class="checkbox no_margin" id="suppressed_label">
						<input id="suppressed_cb" checked="checked" type="checkbox" class="small_right_margin" /> Except for {{#if_equal c_or_g compare="channel"}}@channel{{else}}@{{groupCopy skip_private=true}}{{/if_equal}} mentions <span id="suppressed_disabled_explain" class="normal mini subtle_silver">(disabled due to <strong id="suppressed_disabled_explain_tip_link" class="cursor_pointer">team settings</strong>)</span>
					</label>
					</span>
				{{/if}}

				<label class="radio no_margin normal">
					<input name="channel_loud_rd" type="radio" class="small_right_margin" value="nothing" /> Nothing <span id="all_nothing_default" class="bold">(default)</span>
				</label>
			</p>
		</div>

		<p class="bold small_bottom_margin"><i class="ts_icon ts_icon_mobile ts_icon_inherit" style="font-size: 19px; width: 1rem; margin-left: 0.3rem; margin-right: 0.3rem;"></i> Mobile push notifications</p>
		<p class="small_left_margin">
			<label class="radio no_margin normal">
				<input name="channel_push_loud_rd" type="radio" class="small_right_margin" value="everything" /> Activity of any kind <span id="all_push_everything_default" class="bold">(default)</span>
			</label>
			<label class="radio no_margin normal">
				<input name="channel_push_loud_rd" type="radio" class="small_right_margin" value="mentions" /> Mentions of my name or highlight words <span id="all_push_mentions_default" class="bold">(default)</span>
			</label>

			{{#if show_two_suppressed_cbs}}
				<span id="push_suppressed_span" class="large_left_margin inline_block">
				<label class="checkbox no_margin" id="push_suppressed_label">
					<input id="push_suppressed_cb" checked="checked" type="checkbox" class="small_right_margin" /> Except for {{#if_equal c_or_g compare="channel"}}@channel{{else}}@{{groupCopy skip_private=true}}{{/if_equal}} mentions <span id="push_suppressed_disabled_explain" class="normal mini subtle_silver">(disabled due to <strong id="push_suppressed_disabled_explain_tip_link" class="cursor_pointer">team settings</strong>)</span>
				</label>
				</span>
			{{/if}}

			<label class="radio no_margin normal">
				<input name="channel_push_loud_rd" type="radio" class="small_right_margin" value="nothing" /> Nothing <span id="all_push_nothing_default" class="bold">(default)</span>
			</label>
		</p>

		{{#if show_one_suppressed_cb}}
			<div id="single_suppressed_div">
				<p class="bold no_bottom_margin" style="margin-left: 0.45rem;">
					{{#if_equal c_or_g compare="channel"}}{{#if model_ob.is_general}}@everyone{{else}}@channel{{/if}}{{else}}@{{groupCopy skip_private=true}}{{/if_equal}} notifications
				</p>
				<p class="small_left_margin">
					<label class="checkbox no_margin normal" id="single_suppressed_label">
						<input id="single_suppressed_cb" checked="checked" type="checkbox" class="small_right_margin" />Suppress notifications for <strong>{{#if_equal c_or_g compare="channel"}}{{#if model_ob.is_general}}@everyone{{else}}@channel{{/if}}{{else}}@{{groupCopy skip_private=true}}{{/if_equal}}</strong> and <strong>@here</strong> mentions <span id="single_suppressed_mobile_qualifier">(on mobile)</span><span id="single_suppressed_desktop_qualifier">(on desktop)</span> <span id="single_suppressed_disabled_explain" class="subtle_silver">(disabled due to <strong id="single_suppressed_disabled_explain_tip_link" class="cursor_pointer">team settings</strong>)</span>
					</label>
				</p>
			</div>
		{{/if}}

	</div>

	<div id="muting_div">
		<p class="bold no_bottom_margin">
			<label class="checkbox no_margin no_left_padding" id="muting_label">
				<i class="ts_icon ts_icon_bell_slash ts_icon_inherit small_right_margin" style="font-size: 18px; margin-left: 0.5rem; width: 1rem"></i> Mute this {{#if is_mpim}}conversation{{else}}{{#if_equal c_or_g compare="channel"}}channel{{else}}{{groupCopy}}{{/if_equal}}{{/if}}
				<input id="muting_cb" checked="checked" type="checkbox" style="float: none; margin: -1px 0 0 0.5rem !important; vertical-align: middle;" />
			</label>
		</p>
		<p class="small_left_margin no_bottom_margin">
			Muting prevents all notifications from this {{#if is_mpim}}conversation{{else}}{{#if_equal c_or_g compare="channel"}}channel{{else}}{{groupCopy}}{{/if_equal}}{{/if}} and prevents the {{#if is_mpim}}conversation{{else}}{{#if_equal c_or_g compare="channel"}}channel{{else}}{{groupCopy skip_private=true}}{{/if_equal}}{{/if}} from appearing as unread unless you are mentioned.
		</p>
	</div>

</div>
<div class="modal-footer">
	<p class="mini float_left small_top_margin no_bottom_margin">Set your default notifications settings in your <a href="/account/notifications" target="_blank" class="bold">Account Preferences</a></p>
	<a class="btn dialog_go">Done</a>
</div>
</script>
<script id="debug_prefs_dialog_template" type="text/x-handlebars-template">	<div class="modal-header">
		<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
		<h3>Debugging Preferences</h3>
	</div>
	<div class="modal-body">
		<p>You'll need to reload after changing these preferences.</p>
	
		<p class="small_bottom_margin">
			<label class="checkbox no_margin">
			<input id="ls_disabled_cb" type="checkbox" class="small_right_margin" /> Disable Local Storage. <span class="normal">This will disable Slack from storing data on your computer, and can be used to debug lagginess in the Slack UI.</span>
		</p>
		
		<p class="small_bottom_margin">
			<label class="checkbox no_margin">
				<input id="ss_emojis_cb" type="checkbox" class="small_right_margin" /> Disable Emoji Spritesheets. <span class="normal">This will make loading emoji slower, but it might help if you are experiencing slowness in the Slack UI.</span>
			</label>
		</p>		
	</div>
	<div class="modal-footer">
		<a class="btn dialog_go">Done</a>
	</div>
</script>
<script id="file_upload_dialog_template" type="text/x-handlebars-template">	<div class="modal-header">
		<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
		<h3>Upload a file? <span class="file_count"></span></h3>
	</div>
	<div class="modal-body">
		
		{{#if over_storage_limit}}
			<p class="alert alert_warning">
				<i class="ts_icon ts_icon_info_circle"></i>
				Your team is over its storage limit.<br /> Please <a href="/pricing" target="{{newWindowName}}" class="bold underline">upgrade to a paid tier</a> or <a href="/files" target="{{newWindowName}}" class="bold underline">delete some larger files</a>.</p>
		{{/if}}
		
		<div id="upload_image_preview" class="hidden bottom_margin">
			<img src="" />
		</div>
		
		<p>
			<label for="upload_file_title" class="inline_block">Title</label>
			<input id="upload_file_title" name="upload_file_title" type="text" class="small title_input" value="{{title}}" tabindex="1"/>
			<span class="modal_input_note">
				Titles are the easiest ways to search for files: it pays to be descriptive.
			</span>
			<input id="upload_file_name" name="upload_file_name" type="hidden" {{#if has_name}}disabled="disabled"{{else}}{{/if}} class="filename_input" value="{{filename}}" />
		</p>
		
		{{{sharing_html}}}
		
	</div>
	<div class="modal-footer">
		<div class="span_1_of_1">
			{{#if file_retention_type}}
				<div class="modal_input_note_full_width float_left inline_block align_left">
					Due to your team’s custom file retention <br />policy, this file will be deleted after <span class="bold">{{file_retention_duration}}</span>.
				</div>
			{{/if}}
			{{#if more_in_queue}}<a class="btn btn_outline dialog_cancel_all" tabindex="5">Cancel All</a>{{/if}}
			<a class="btn btn_outline dialog_cancel" tabindex="5">Cancel</a>
			<a class="btn dialog_go" tabindex="6">Upload</a>
		</div>
	</div>
</script>
<script id="share_dialog_template" type="text/x-handlebars-template">	<div class="modal-header">
		<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
		<h3>
			Share
			{{#if_equal type compare='file'}}File{{/if_equal}}
			{{#if_equal type compare='file_snippet'}}Snippet{{/if_equal}}
			{{#if_equal type compare='file_post'}}Post{{/if_equal}}
			{{#if_equal type compare='file_space'}}Post{{/if_equal}}
		</h3>
	</div>
	<div class="modal-body share_dialog">

		<input type="hidden" id="share_type" value="{{type}}" />
		<input type="hidden" id="share_item_id" value="{{item.id}}" />

		{{{file_html}}}

		{{{sharing_html}}}

	</div>
	<div class="modal-footer">
		<a class="btn btn_outline dialog_cancel" tabindex="3">Cancel</a>
		<a class="btn dialog_go" tabindex="2">Share</a>
	</div>
</script>
<script id="lightbox_dialog_template" type="text/x-handlebars-template">	<div class="modal-body lightbox_dialog
		{{#if external}} external 
		{{else}}
			{{#if file.image_exif_rotation}}orientation_{{file.image_exif_rotation}}{{/if}}
		{{/if}}
		">
		<button type="button" class="close" data-dismiss="modal" aria-hidden="true"><i class="ts_icon ts_icon_times"></i></button>

		<div id="lightbox_image_container">
		</div>

		<div id="lightbox_preloader">
		</div>

	</div>
	<button type="button" class="lightbox_nav hidden faded" id="lightbox_go_left"><i class="ts_icon ts_icon_chevron_large_left ts_icon_inherit"></i></button>
	<button type="button" class="lightbox_nav hidden faded" id="lightbox_go_right"><i class="ts_icon ts_icon_chevron_large_right ts_icon_inherit"></i></button>
</script>
<script id="lightbox_image_template" type="text/x-handlebars-template"><i id="spinner" class="loading"></i>

{{#if file.thumb_360_gif}}
	<img class="lightbox_image" src="{{file.url_private}}"/>
{{else}}
	{{#if file.thumb_1024}}
		<img class="lightbox_image" src="{{file.thumb_1024}}"/>
	{{else}}
		<img class="lightbox_image {{#if file.image_exif_rotation}}orientation_{{file.image_exif_rotation}}{{/if}}" {{#if file.image_exif_rotation}}data-exif-orientation="{{file.image_exif_rotation}}"{{/if}} src="{{file.url_private}}"/>
	{{/if}}
{{/if}}

<div class="lightbox_meta" data-url="{{file.url_private}}">

	{{{makeMemberPreviewLinkImage member.id 32}}}
	<span class="{{getMemberColorClassById member.id}}">{{{makeMemberPreviewLink member}}}</span>
	<span class="title overflow_ellipsis">
		<a href="{{file.permalink}}" target="{{file.id}}" data-file-id="{{file.id}}">
			{{{formatFileTitle file}}}
		</a>
		{{{star 'file' file null}}}
	</span>

	{{#if file.is_external}}
		{{#if_equal file.external_type compare="gdrive"}}
			<a {{{makeRefererSafeLink url=file.url_private}}} target="{{file.url_private}}" class="icon_new_window no_underline" title="Open original in Google Drive"><img src="{{versioned_services_gdrive_16}}" class="gdrive_icon grayscale" /></a>
		{{/if_equal}}
		{{#if_equal file.external_type compare="dropbox"}}
			<a {{{makeRefererSafeLink url=file.url_private}}} target="{{file.url_private}}" class="icon_new_window no_underline" title="Open original in Dropbox"><i class="ts_icon ts_icon_dropbox"></i></a>
		{{/if_equal}}
		{{#if_equal file.external_type compare="box"}}
			<a {{{makeRefererSafeLink url=file.url_private}}} target="{{file.url_private}}" class="icon_new_window no_underline" title="Open original in Box"><img src="{{versioned_services_box_32}}" class="box_icon grayscale" /></a>
		{{/if_equal}}
		{{#if_equal file.external_type compare="onedrive"}}
			<a {{{makeRefererSafeLink url=file.url_private}}} target="{{file.url_private}}" class="icon_new_window no_underline" title="Open original in OneDrive"><img src="{{versioned_services_onedrive_32}}" class="onedrive_icon grayscale" /></a>
		{{/if_equal}}
	{{else}}
		<a href="{{file.url_private}}" target="{{file.url_private}}" class="ts_icon ts_icon_external_link icon_new_window" title="Open original in new tab"></a>
	{{/if}}

</div>
</script>
</script>
<script id="lightbox_external_image_template" type="text/x-handlebars-template">	<i id="spinner"></i>
	<img class="lightbox_image" src="{{file_src}}" {{#if img_width}}data-width="{{img_width}}"{{/if}} {{#if img_height}}data-height="{{img_height}}"{{/if}} />
	<div class="lightbox_meta external" data-url="{{link_url}}">
		<span class="title overflow_ellipsis">
			<a {{{makeRefererSafeLink url=link_url}}} target="_blank">
				Open in a new tab
			</a>
		</span>				
		<a {{{makeRefererSafeLink url=link_url}}} target="_blank" class="ts_icon ts_icon_external_link icon_new_window" title="Open original in new tab"></a>
	</div>
</script>
<script id="snippet_dialog_template" type="text/x-handlebars-template">	<div class="modal-header">
		<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
		<h3>{{mode}} Snippet</h3>
	</div>
	<div class="modal-body share_dialog">

		<form action="" id="client_file_snippet" method="post" accept-encoding="UTF-8" onsubmit="return false;" class="no_bottom_margin">

			<p>
				<label id="client_file_snippet_select_label" class="select small float_right no_right_padding">
					<select name="filetype" id="client_file_snippet_select" name="client_file_snippet_select" class="small no_top_margin">
						<option value="auto">Auto Detect Type</option>
						{{#each codemirror_types}}
							<option value="{{this.type}}">{{this.label}}</option>
						{{/each}}
					</select>
				</label>
				<input type="text" id="client_file_snippet_title_input" class="small" name="client_file_snippet_title_input" value="" placeholder="Title (optional)" />
			</p>
			<p>
				<textarea name="content" wrap="virtual" id="client_file_snippet_textarea" class="client_file_snippet_textarea full_width{{#if_equal mode compare="Create"}} create_snippet{{/if_equal}}"></textarea>
				<label class="checkbox normal mini float_right no_min_width" style="margin-top: 3px; padding-right: 0; width: auto;">
					<input type="checkbox" id="client_file_wrap_cb" {{#if wrap_lines}}checked{{/if}}> wrap
				</label>
			</p>

			{{{sharing_html}}}

		</form>

	</div>

	<div class="modal-footer">
		<div class="modal-footer-confirm hidden">
			<p class="confirm-text">Are you sure you want to discard this Snippet permanently?</p>
			<button type="button" class="btn btn_outline dialog_cancel_decline">Cancel</button>
			<button type="button" class="btn btn_danger dialog_cancel">Yes, discard this Snippet</button>
		</div>
		<div class="modal-footer-action">
			<a class="btn btn_outline cancel" data-dismiss="modal" tabindex="3">Cancel</a>
			{{#if_equal mode compare="Edit"}}
			<a class="btn dialog_go" tabindex="2">Save changes</a>
			{{/if_equal}}
			{{#if_equal mode compare="Create"}}
			<a class="btn dialog_go" tabindex="2">Create Snippet</a>
			{{/if_equal}}
		</div>
	</div>

</script>
<script id="growl_prompt_overlay_template" type="text/x-handlebars-template">	<div id="growl_prompt_overlay">
	
		<div id="growl_prompt_overlay_impossible" class="hidden">			
			<h3>The browser you're using doesn't support desktop notifications.</h3>
			<p>When someone mentions you or sends you a direct message in Slack, we can let you know via a desktop notification.</p>
			<p>If you'd like to get desktop notifications from Slack, you can use a browser that supports them (like <a href="http://www.google.com/chrome/" class="bold">Google Chrome</a>), or download one of our <a href="/apps" class="bold" target="{{newWindowName}}">desktop apps</a>.</p>
			<p style="line-height: 26px;" class="large_top_margin no_bottom_margin">
				<a href="/apps" class="btn btn_small  see-apps" target="{{newWindowName}}">See our Apps</a>
				<span class="left_margin right_margin">or</span>
				<a class="prompt_cancel_forever">Not for me</a>
			</p>
		</div>
		
		<div id="growl_prompt_overlay_start" class="hidden">			
			<h3>Turn on desktop notifications?</h3>
			<p>When someone mentions you or sends you a direct message in Slack, we will let you know via a desktop notification.</p>
			<p style="line-height: 26px;" class="no_bottom_margin">
				<a class="prompt_allow btn btn_small ">Yes, turn on notifications</a>
				<span class="left_margin right_margin">or</span>
				<a class="prompt_cancel_forever">No, don't turn them on</a>
			</p>
		</div>
		
		<div id="growl_prompt_overlay_tell_to_allow" class="hidden">
			<i class="ts_icon ts_icon_arrow_circle_up block float_right" style="font-size: 3.5rem; margin: 0 1rem 0 0;"></i>
			<h3>Turn on desktop notifications?</h3>
			<p class="no_bottom_margin">Click <strong>Allow</strong> above to turn on desktop notifications.</p>
		</div>
		
		<div id="growl_prompt_overlay_success" class="hidden">
			<h3>Desktop notifications enabled</h3>
			<p>When someone mentions you or sends you a direct message in Slack, we will let you know via a desktop notification.</p>
			<p style="line-height: 26px;" class="no_bottom_margin">
				<a class="prompt_test btn btn_small ">Send me a test notification</a>
				<span class="left_margin right_margin">or</span>
				<a class="prompt_cancel">I'm done</a>
			</p>
		</div>
		
		<div id="growl_prompt_overlay_disallowed" class="hidden">
			<h3>Desktop notifications disabled</h3>
			<p>You chose not to allow desktop notifications. You will need to update your browser preferences in order to turn them on.</p>
			<p><a class="prompt_cancel btn btn_small float_right">OK</a></p>
			<div class="clear_both"></div>
		</div>
		
	</div>
</script>
<script id="channel_invite_list_template" type="text/x-handlebars-template">	<p class="top_margin">
		<label for="select_invite_channels" class="inline_block">Invite to</label>
		<select id="select_invite_channels" name="select_invite_channels" class="file_share_select no_margin">
			<option value="ts_null_value">Select a channel</option>
			{{#each channels}}
				<option value="{{this.id}}">#{{this.name}}</option>
			{{/each}}
		</select>
	</p>

</script>
<script id="group_invite_list_template" type="text/x-handlebars-template">    {{#if groups}}
	<p class="top_margin">
		<label for="select_invite_groups" class="inline_block">Invite too</label>
		<select id="select_invite_groups" name="select_invite_groups" class="file_share_select inline_block no_margin">
			<option value="ts_null_value">Select a group</option>
			{{#each groups}}
				<option value="{{this.id}}">{{{groupPrefix}}}{{this.name}}</option>
			{{/each}}
		</select>
	</p>
	
	<p class="top_margin">
		-OR CREATE A NEW GROUP-
	</p>
	{{/if}}

</script>
<script id="channel_member_invite_list_template" type="text/x-handlebars-template">{{#if show_ra_tip}}
	<p class="no_bottom_margin">
		Type or select the names of team members that you would like to invite:
	</p>
	<p class="small_bottom_margin mini subtle_silver">
		Restricted Accounts will not appear in this list. Ask a team administrator to invite them.
	</p>
{{else}}
	<p class="small_bottom_margin">
		Type or select the names of team members that you would like to invite:
	</p>
{{/if}}

	<div id="select_invite_channel_members_holder">
	
		<p class="no_bottom_margin">
			<select multiple="multiple" id="select_invite_channel_members" size="30">
				{{#each invite_members}}
					<option value="{{this.member.id}}" data-additional-search-field="@{{this.member.name}}"{{#if this.preselected}} selected="selected"{{/if}}>{{#if this.member.real_name}}{{this.member.real_name}} • {{this.member.name}}{{else}}{{this.member.name}}{{/if}}{{#if this.member.is_restricted}} (Restricted Account){{/if}}</option>
				{{/each}}
			</select>		
		</p>
		
	</div>

</script>
<script id="group_member_invite_list_template" type="text/x-handlebars-template">	<div id="group_invite_member_chooser" class="hidden">
		{{#if show_ra_tip}}
			<p class="no_bottom_margin">
				Type or select the names of team members that you would like to invite:
			</p>
			<p class="small_bottom_margin mini subtle_silver">
				Restricted accounts may not appear below. Ask a team administrator to invite them.
			</p>
		{{else}}
			<p class="small_bottom_margin">
				Type or select the names of team members that you would like to invite:
			</p>
		{{/if}}
	
		<div id="select_invite_group_members_holder">
		
			<p class="no_bottom_margin">
				<select multiple="multiple" id="select_invite_group_members" size="30">
					{{#each invite_members}}
						<option value="{{this.member.id}}" data-additional-search-field="@{{this.member.name}}"{{#if this.preselected}} selected="selected"{{/if}}>{{#if this.member.real_name}}{{this.member.real_name}} • {{this.member.name}}{{else}}{{this.member.name}}{{/if}}{{#if this.member.is_restricted}} (Restricted Account){{/if}}</option>
					{{/each}}
				</select>		
			</p>
			
		</div>
		
		<p class="top_margin">
			<label class="checkbox no_margin">
				<input id="archive_access_cb" checked="checked" type="checkbox" class="small_right_margin" /> Invited members will have access to the {{groupCopy}} archives
			</label>
		</p>
	</div>
	
	
	<div id="group_invite_archives_prompt" class="">
		<p class="bold">Should new members be allowed to see the {{groupCopy}}'s message history?</p>
		
		<p>If <strong>Yes</strong>, new members will be invited and will have access to this {{groupCopy}}'s entire message history.</p> 
		<p>If <strong>No</strong>, this {{groupCopy}} will be renamed and archived. A new {{groupCopy}} will be created with all current members plus the new ones you invite. You and other current members will see a link back to the original {{groupCopy}}'s archives.</p>
	</div>
	
</script>
<script id="channel_conversion_dialog_template" type="text/x-handlebars-template">	<p>Converting <b>#{{name}}</b> to a {{privateGroupCopy}} will preserve the history and membership.</p>
	<p class="small_bottom_margin"><b>Two things you should know:</b></p>
	<ul>
		<li>This conversion is not reversible. It is a one-way street.</li>
		<li>Files that were previously shared in this channel will not become private. They will remain publicly accessible to others on your team.</li>
	</ul>
	<p>Are you sure you want to convert <b>#{{name}}</b> to a {{privateGroupCopy}}?</p>
</script>
<script id="channel_data_retention_dialog_template" type="text/x-handlebars-template">	<p>This message retention policy will only affect this {{model_type}}. Retention policies can also be set on a team-wide basis in your <a target="new" href="/admin/settings#data_retention">team settings</a>.</p>

	<p id="retention_duration_warning" class="alert alert_warning hidden {{#isWeb}}small{{/isWeb}}">
		<i class="ts_icon ts_icon_warning"></i>
		<strong>An important note about message retention policies</strong><br />
		Setting a custom duration for message retention means that messages in this {{model_type}} will be  deleted after the number of days you set. This deletion is permanent and the messages will be irretrievable. Proceed with caution!
	</p>

	<div class="clearfix">
		{{#isWeb}}		
			<p class="col span_4_of_6">
				<label for="retention_type" class="select small">
					Retention Type
					<select name="retention_type" class="small">
						<option value="0"{{#if_equal retention_type compare=0}} selected="selected"{{/if_equal}}>Use team preference</option>
						<option value="1"{{#if_equal retention_type compare=1}} selected="selected"{{/if_equal}}>Retain all messages for a specific number of days</option>
					</select>
				</label>
			</p>
			<p class="col span_2_of_6 {{#if_equal retention_type compare=0}}hidden{{/if_equal}}" id="retention_duration_container">
				<label for="retention_duration">Duration</label>
				<input type="text" name="retention_duration" id="retention_duration" class="mini align_right" value="{{retention_duration}}" /> days
			</p>
		{{else}}
			<p class="col span_4_of_6">
				<label for="retention_type" class="select small full_width align_left">
					Retention Type
					<select name="retention_type" class="small" style="margin-bottom: 4px;">
						<option value="0"{{#if_equal retention_type compare=0}} selected="selected"{{/if_equal}}>Use team preference</option>
						<option value="1"{{#if_equal retention_type compare=1}} selected="selected"{{/if_equal}}>Retain all messages for a specific number of days</option>
					</select>
				</label>
			</p>

			<div class="col span_2_of_6 {{#if_equal retention_type compare=0}}hidden{{/if_equal}}" id="retention_duration_container">
				<label for="retention_duration" class="align_left">Duration</label>
				<div class="input-append no_bottom_margin">
					<input type="text" name="retention_duration" id="retention_duration" class="input-mini align_right" value="{{retention_duration}}" style="border-radius: 4px 0 0 4px !important; width: 60px; height: 31px;" />
					<span class="add-on" style="line-height: 21px;">days</span>
				</div>
			</div>
		{{/isWeb}}
	</div>

	<div id="team_retention_pref" class="hidden">
		<p>
			The team preference is to
			{{#if_equal team_type compare=0}}<strong>retain all messages.</strong>{{/if_equal}}
			{{#if_equal team_type compare=1}}<strong>retain all messages AND also retain edit and deletion logs for all messages.</strong>{{/if_equal}}
			{{#if_equal team_type compare=2}}<strong>retain all messages for {{team_duration}} {{#if_equal team_duration compare=1}}day{{else}}days{{/if_equal}}.</strong>{{/if_equal}}
		</p>
	</div>

</script>
<script id="channel_deletion_dialog_template" type="text/x-handlebars-template">	<p>Are you sure you want to delete <b>{{name}}</b>? All its content will be removed from your Slack archives, and you cannot restore the content once deleted.</p>
	<p class="large_left_margin no_bottom_margin">
		<label class="checkbox normal" style="font-size: 1rem;">
			<input id="delete_channel_cb" type="checkbox" class="small_right_margin" />
			Yes, I am absolutely sure
		</label>
	</p>
</script>
<script id="channel_options_dialog_template" type="text/x-handlebars-template">	<div class="modal-header">
		<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
		<h3>Advanced Options for {{display_name}}</h3>
	</div>
	<div class="modal-body loading_animation_container">
		{{{loadingHTML}}}
	</div>
	<div class="modal-body hidden">
	
		{{#if show_archive_btn}}
			<p class="bold no_bottom_margin"><a id="{{#if_equal c_or_g compare="channel"}}channel_archive_btn{{else}}group_archive_btn{{/if_equal}}" class="bold">Archive this {{#if_equal c_or_g compare="channel"}}channel{{else}}{{groupCopy}}{{/if_equal}}</a></p>
			<p style="line-height: 1.25rem;">If you don't think it will be used any more and you want to clean up, archive it. The {{#if_equal c_or_g compare="channel"}}channel{{else}}{{groupCopy}}{{/if_equal}} can be unarchived later (but everyone will have been removed).</p>
		{{/if}}
		
		{{#if show_convert_btn}}
			<p class="bold no_bottom_margin"><a id="channel_convert_btn" class="bold">Convert this channel to a {{privateGroupCopy}}</a></p>
			<p style="line-height: 1.25rem;">Private {{groupCopy skip_private=true}}s are similar to channels, but they're hidden to non-members and the conversation is private. This conversion cannot be undone.</p>
		{{/if}}	
		
		{{#if show_rename_btn}}
			<p class="bold no_bottom_margin"><a id="channel_rename_btn" class="bold">Rename this {{#if_equal c_or_g compare="channel"}}channel{{else}}{{groupCopy skip_private=true}}{{/if_equal}}</a></p>		
			<p style="line-height: 1.25rem;">You can rename a {{#if_equal c_or_g compare="channel"}}channel{{else}}{{groupCopy skip_private=true}}{{/if_equal}} at any time. But, use it sparingly: it might confuse or disorient your colleagues!</p>
		{{/if}}

		{{#if show_purpose_btn}}
			<p class="bold no_bottom_margin"><a id="channel_purpose_btn" class="bold">{{#if model_ob.purpose.value}}Edit{{else}}Set{{/if}} the {{#if_equal c_or_g compare="channel"}}channel{{else}}{{groupCopy skip_private=true}}{{/if_equal}} purpose</a></p>
			<p style="line-height: 1.25rem;">
				{{#if_equal c_or_g compare="channel"}}Channel{{else}}{{groupCopy skip_private=true caps=true}}{{/if_equal}} purposes are especially useful to new team members choosing which conversations to join.
				{{#if model_ob.purpose.value}}
					This {{#if_equal c_or_g compare="channel"}}channel{{else}}{{groupCopy skip_private=true}}{{/if_equal}}'s current purpose is <em>"{{{formatTopicOrPurpose model_ob.purpose.value}}}"</em>
				{{/if}}
			</p>
		{{/if}}
		
		<div class="retention_policy_container hidden">
			<p class="bold no_bottom_margin"><a id="data_retention_btn">Set the {{#if_equal c_or_g compare="channel"}}channel{{else}}{{groupCopy skip_private=true}}{{/if_equal}} message retention policy</a></p>
			<p class="no_bottom_margin" style="line-height: 1.25rem;">By default, Slack will save your message data forever. You can configure a custom message retention policy duration.</p>
		</div>

	</div>
	<div class="modal-footer">
		<a class="btn dialog_go">Done</a>
	</div>
</script>
<script id="coachmark_template" type="text/x-handlebars-template"><div id="coachmark" class="lato_regular normal hidden">
	<div id="coachmark_callout"></div>
	<div id="coachmark_interior" class="lato">
		{{! content divs are dynamically added depending on what type of coachmark is being shown }}
		<div id="coachmark_footer">
			<div class="coachmark_footer_text">
				<span>Done? </span><a class="coachmark_skip_link">Click here to skip</a>
			</div>
			<a class="btn coachmark_got_it float_right">Got it!</a>
		</div>
	</div>
</div>
</script>
<script id="channels_coachmark_template" type="text/x-handlebars-template"><div id="channels_coachmark_div" class="coachmark_div">
	<div class="coachmark_contents">
		{{#feature flag="feature_private_channels"}}
			<h2 class="black">{{#if_gt total_count compare=1~}}
				These are your channels
			{{~else~}}
				{{~#if in_single_private_channel~}}
					This is your private channel
				{{~else~}}
					This is your channel
				{{~/if~}}
			{{~/if_gt}}</h2>
			{{~#currentUserIsAdmin~}}
				<p>Channels are chat rooms based around a project, a topic (such as <em>music</em>), or a team (such as <em>sales</em>). Channels can be public or private.</p>
			{{~else~}}
				{{~#currentUserIsRA~}}
					<p>{{#if in_single_private_channel~}}
						Private channels are invite-only rooms. You only have access to this channel right now.
					{{~else~}}
						Channels are chat rooms based around a project, a topic (such as <em>music</em>), or a team (such as <em>sales</em>).
					{{~/if~}}
					{{~#unless in_single_private_channel~}}
						{{~#currentUserIsURA}}{{else~}}
							{{~#if_equal total_count compare=1}} You have access to just one channel right now.
							{{~else}} You have access to these channels in <strong>{{currentTeamName}}</strong>.
							{{~/if_equal~}}
						{{~/currentUserIsURA~}}
					{{~/unless}}</p>
				{{~else~}}
					<p>Channels are chat rooms created by people in your Slack team. You've been added to some channels already. Channels can be public or private, and you can <strong>join any public channel</strong> in <strong>{{currentTeamName}}</strong>.</p>
				{{~/currentUserIsRA~}}
			{{~/currentUserIsAdmin~}}
		{{else}}
			<h2 class="black">{{#if_gt channels_count compare=1}}These are your channels{{else}}This is your channel{{/if_gt}}</h2>
			{{~#currentUserIsAdmin~}}
				<p>Channels are chat rooms based around a project, a topic (such as <em>music</em>), or a team (such as <em>sales</em>). You'll be able to create more later.</p>
			{{~else~}}
				{{~#currentUserIsRA~}}
					<p>Channels are chat rooms based around a project, a topic (such as <em>music</em>), or a team (such as <em>sales</em>).
						{{~#currentUserIsURA}}{{else}} You have access to {{#if_equal channels_count compare=1~}}
							just one channel right now
						{{~else~}}
							these channels in <strong>{{currentTeamName}}</strong>
						{{~/if_equal~}}{{~/currentUserIsURA~}}
					</p>
				{{~else~}}
					<p>Channels are chat rooms created by people in your Slack team. You've been added to some already. You can <strong>join any channel</strong> in <strong>{{currentTeamName}}</strong>.</p>
				{{~/currentUserIsRA~}}
			{{~/currentUserIsAdmin~}}
		{{/feature}}
	</div>
</div>		
</script>
<script id="invites_coachmark_template" type="text/x-handlebars-template"><div id="invites_coachmark_div" class="coachmark_div">
	<div class="coachmark_contents">
		<h2 class="black">Invite people to your team</h2>
		<p>To invite coworkers to <strong>{{currentTeamName}}</strong>, click the <strong>Invite People</strong> button.</p>
	</div>
</div>
</script>
<script id="direct_messages_coachmark_template" type="text/x-handlebars-template"><div id="direct_messages_coachmark_div" class="coachmark_div">
	<div class="coachmark_contents">
		<h2 class="black">Send direct messages</h2>
		{{~#currentUserIsAdmin~}}
			<p>Direct messages are private, <strong>1-to-1 messages</strong>. Once you invite people, you'll be able to chat with them here.</p>
		{{~else~}}
			<p>Direct messages are private, <strong>1-to-1 messages</strong>.
			{{~#currentUserIsRA~}}
				{{~#if_equal channels_count compare=0}} You can directly message anyone in the same group as you.
				{{~else~}}
					{{~#if_gt groups_count compare=0}} You can directly message anyone in the same channels or groups as you.
					{{~else}} You can directly message anyone in the same {{pluralize channels_count 'channel'}} as you.
					{{~/if_gt~}}
				{{~/if_equal~}}
			{{~else}} You can chat with any member of <strong>{{currentTeamName}}</strong>.
			{{~/currentUserIsRA~}}
			</p>
		{{~/currentUserIsAdmin~}}
	</div>
</div>
</script>
<script id="search_coachmark_template" type="text/x-handlebars-template"><div id="search_coachmark_div" class="coachmark_div">
	<div class="small_coachmark_contents">
		<span><strong class="black">Click</strong> to learn more about search.</span>
	</div>
	<div class="coachmark_contents">
		<h2 class="black">Everything on Slack is searchable</h2>
		<p>Any files, messages, or documents that you upload to Slack will be easy to search for here.</p>
	</div>
</div>
</script>
<script id="recent_mentions_coachmark_template" type="text/x-handlebars-template"><div id="recent_mentions_coachmark_div" class="coachmark_div">
	<div class="small_coachmark_contents">
		<span><strong class="black">Click</strong> to learn more about @ mentions.</span>
	</div>
	<div class="coachmark_contents">
		<h2 class="black">All your @ mentions in one place</h2>
		<p>Anytime someone mentions your name or any of your highlight words, the message will be listed here.</p>
	</div>
</div>
</script>
<script id="starred_items_coachmark_template" type="text/x-handlebars-template"><div id="starred_items_coachmark_div" class="coachmark_div">
	<div class="small_coachmark_contents">
		<span><strong class="black">Click</strong> to learn more about starred items.</span>
	</div>
	<div class="coachmark_contents">
		<h2 class="black">These are starred items</h2>
		<p>You can <strong>star</strong> items that you want to save for later, like a bookmark. Conversations and files can be starred and saved.</p>
	</div>
</div>
</script>
<script id="private_groups_coachmark_template" type="text/x-handlebars-template"><div id="private_groups_coachmark_div" class="coachmark_div">
	<div class="small_coachmark_contents">
		<span><strong class="black">Click</strong> to learn more about private groups.</span>
	</div>
	<div class="coachmark_contents">
		<h2 class="black">
			{{~#currentUserIsRA~}}
				{{~#if_gt channels_count compare=0~}}
					{{~#if_gt groups_count compare=1~}}
						These are your private groups
					{{~else~}}
						{{~#if_equal groups_count compare=1~}}
							This is your private group
						{{~else~}}
							Private groups are invite-only
						{{~/if_equal~}}
					{{~/if_gt~}}
				{{~else~}}
					This is your group
				{{~/if_gt~}}
			{{~else~}}
				Private groups are invite-only
			{{~/currentUserIsRA~}}
		</h2>
		{{~#currentUserIsRA~}}
			<p>Groups are private, <strong>invite-only rooms</strong>. {{#if_gt groups_count compare=1~}}
				You have access to the groups listed here
			{{~else~}}
				{{~#if_equal groups_count compare=1~}}
					You only have access to this group
				{{~else~}}
					People in <strong>{{currentTeamName}}</strong> will not know about a private group unless you invite them.
				{{~/if_equal~}}
			{{~/if_gt~}}
			.<p>
		{{~else~}}
			<p>Use private groups for <strong>invite-only conversations</strong>. People in <strong>{{currentTeamName}}</strong> will not know about a private group unless you invite them.</p>
		{{~/currentUserIsRA~}}
	</div>
</div>
</script>
<script id="shortcuts_dialog_template" type="text/x-handlebars-template">	<button type="button" class="close" data-dismiss="modal" aria-hidden="true"><i class="ts_icon ts_icon_times"></i></button>
	<div class="modal-body">

		<h1 class="align_center" style="margin-left: -5rem;">
			Keyboard Shortcuts 
			<span style="position: relative; top: -0.375rem; left: 1rem;" aria-hidden="true">
				<span class="keyboard" aria-label="{{#isMac}}Command{{else}}Control{{/isMac}}">{{#isMac}}Cmd{{else}}Ctrl{{/isMac}}</span><span class="keyboard" aria-label="Question mark">/</span>
			</span>
			<span class="offscreen">To return to this at any time, press {{#isMac}}Command{{else}}Control{{/isMac}} question mark. To close, press escape.</span>
		</h1>
		
		<div class="col span_1_of_3">
			<h3>Channels & DMs</h3>
			<ul class="no_bullets">
				<li>Previous in list: <span class="keyboard">{{meta_key}}</span><span class="keyboard"><i class="ts_icon ts_icon_arrow_up_medium ts_icon_inherit" aria-label="Up arrow"></i></span></li>
				<li>Next in list: <span class="keyboard">{{meta_key}}</span><span class="keyboard"><i class="ts_icon ts_icon_arrow_down_medium ts_icon_inherit" aria-label="Down arrow"></i></span></li>
				<li>Previous unread: <span class="keyboard">{{meta_key}}</span><span class="keyboard">Shift</span><span class="keyboard"><i class="ts_icon ts_icon_arrow_up_medium ts_icon_inherit" aria-label="Up arrow"></i></span></li>
				<li>Next unread: <span class="keyboard">{{meta_key}}</span><span class="keyboard">Shift</span><span class="keyboard"><i class="ts_icon ts_icon_arrow_down_medium ts_icon_inherit" aria-label="Down arrow"></i></span></li>
				<li>Back in history: {{#isMac}}<span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">[</span>{{else}}<span class="keyboard">{{meta_key}}</span><span class="keyboard"><i class="ts_icon ts_icon_arrow_left" aria-label="Left arrow"></i></span>{{/isMac}}</li>
				<li>Forward in history: {{#isMac}}<span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">]</span>{{else}}<span class="keyboard">{{meta_key}}</span><span class="keyboard"><i class="ts_icon ts_icon_arrow_right" aria-label="Right arrow"></i></span>{{/isMac}}</li>
				<li>Mark as read: <span class="keyboard" aria-label="Escape">Esc</span></li>
				<li>Mark all as read: <span class="keyboard">Shift</span><span class="keyboard" aria-label="Escape">Esc</span></li>
				<li>Quick switcher: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">k</span>{{#isOurApp}} or <span class="keyboard">t</span>{{/isOurApp}}</li>
				{{#if show_browse_dms_shortcut}}<li>Browse DMs: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">Shift</span><span class="keyboard">k</span></li>{{/if}}
			</ul>			
		</div>

		<div class="col span_1_of_3">
			<h3>Messaging</h3>
			<ul class="no_bullets">
			{{#if can_show_a11y_keyboard_shortcuts}}
				{{! The following four keyboard shortcuts don't show up in the UI, and are only read by screenreaders. }}
				<li class="hidden" aria-hidden="false">Next message: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">{{meta_key}}</span><span class="keyboard">]</span></li>
				<li class="hidden" aria-hidden="false">Previous message: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">{{meta_key}}</span><span class="keyboard">[</span></li>
				<li class="hidden" aria-hidden="false">Oldest unread message: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">{{meta_key}}</span><span class="keyboard">-</span></li>
				<li class="hidden" aria-hidden="false">Message input: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">{{meta_key}}</span><span class="keyboard">=</span></li>
			{{/if}}
				<li>
					Autocomplete
					<ul>
						<li>Names: <span class="subtle_silver">[a-z]</span><span class="keyboard">Tab</span> <span class="subtle_silver">or</span> <span class="keyboard">@</span><span class="keyboard">Tab</span></li>
						<li>Channels: <span class="keyboard" aria-label="Number symbol">#</span><span class="keyboard">Tab</span></li>
						<li>Emoji: <span class="keyboard" aria-label="Colon">:</span><span class="keyboard">Tab</span></li>
					</ul>
				</li> 
				<li>New line: <span class="keyboard">Shift</span><span class="keyboard">Enter</span></li>
				<li>Edit last message: <span class="keyboard"><i class="ts_icon ts_icon_arrow_up_medium ts_icon_inherit" aria-label="Up arrow"></i></span> <span class="subtle_silver">in input</span></li>
				<li>React to last message: <span class="keyboard" aria-label="{{#isMac}}command{{else}}control{{/isMac}}">{{cmd_key}}</span><span class="keyboard">Shift</span><span class="keyboard">\</span></li>
			</ul>
		</div>
		
		<div class="col span_1_of_3 no_right_margin">
			<h3>Extras</h3>
			<ul class="no_bullets">		
				{{#isOurApp}}<li>Open Preferences: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard" aria-label="Comma">,</span></li>{{/isOurApp}}
				<li>Toggle Flexpane: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">.</span></li>
					<ul>
						{{#isOurApp}}<li>Channel Info: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">Shift</span><span class="keyboard">i</span></li>{{/isOurApp}}
						{{#isChrome}}{{else}}<li>Mentions: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">Shift</span><span class="keyboard">m</span></li>{{/isChrome}}
						{{#isFF}}{{else}}<li>Team: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">Shift</span><span class="keyboard">e</span></li>{{/isFF}}
						<li>Stars: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">Shift</span><span class="keyboard">s</span></li>
						{{#isOurApp}}<li>Search: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">f</span></li>{{/isOurApp}}
					</ul>
				<li>Paste Snippet: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span>{{#isSafariDesktop}}<span class="keyboard" aria-label="Option">Opt</span>{{/isSafariDesktop}}<span class="keyboard">Shift</span><span class="keyboard">v</span></li>
				<li>Upload a File: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">u</span></li>
				<li>Dismiss Dialogs: <span class="keyboard" aria-label="Escape">Esc</span></li>
			</ul>
		</div>

		<div class="clear_both"></div>
				
		<p class="info_block align_center no_bottom_margin">
			Type <strong class="command">/</strong> to learn about other shortcuts, like <strong class="command">/msg</strong> [name], <strong class="command">/invite</strong> [name], and <strong class="command">/join</strong> [channel name]
		</p>

	</div>
</script>
<script id="omnibox_template" type="text/x-handlebars-template"><div class="modal-body">
	<div id="omnibox_ui">
		<p id="omnibox_help" aria-hidden="true">
			Jump to a conversation
			<span class="float_right" style="margin-right: 0.25rem;">
				<strong>tab</strong>&nbsp; or &nbsp;<strong>&uarr;</strong> <strong>&darr;</strong>&nbsp; to navigate <strong class="small_left_margin" aria-label="Return">↵</strong>&nbsp; to select <strong class="small_left_margin" aria-label="Escape">esc</strong>&nbsp; to dismiss
			</span>
		</p>
		<input type="text" id="omnibox_input" aria-label="Quick switcher. Type to jump to a conversation. Up arrow and down arrow navigates results, return selects, escape closes." />
		<div id="omnibox_results"></div>
		<p class="no_results hidden">
			No matches found for <strong class="query"></strong>.<br />
			Have you spelled it correctly?
			<br><button class="btn btn_outline small_top_margin create_channel"></button>
		</p>
		
	</div>
	<div id="omnibox_switching" class="hidden">
		<img id="switch_spinner" src="{{versioned_loading_hash_animation}}" />
		<h4 class="large_bottom_margin">Switching to <span id="switched_team_name"></span> ...</h4>
	</div>
</div>
</script>
<script id="at_channel_warning_dialog_template" type="text/x-handlebars-template">	<div class="modal-body">
		<p>
			By using <span class="mention_yellow_bg">@{{keyword}}</span>, you are about to notify <a href="#" class="channel_members_toggle">{{pluralCount member_count "person" "people"}}</a>{{#if_equal timezone_count compare=1}}{{else}} in <strong>{{timezone_count}} timezones{{/if_equal}}</strong>. Are you sure?
		</p>
		<div>
			<a class="btn btn_outline small_right_margin dialog_cancel">Edit message</a>
			<a class="btn btn_success dialog_go">Send it now</a>
		</div>
		<div>
			<span class="tiny dialog_cancel_hint"><strong aria-label="escape">Esc</strong> to edit</span>
			<span class="tiny dialog_go_hint"><strong aria-label="return">Return <span class="return_char">&crarr;</span></strong> to send</span>
		</div>
{{#currentUserIsAdmin}}
		<div>
			<span class="tiny dialog_admin_hint">Pssst... admins! <a href="/admin/settings#permissions" target="_blank">Team settings</a> control this warning</span>
		</div>
{{else}}
		<div>
			<span class="tiny dialog_admin_hint">Psssssst! These warnings can be modified by a team admin!</span>
		</div>
{{/currentUserIsAdmin}}

		<div class="channel_members popover_menu hidden">
			<div class="channel_members_scroller"></div>
			<a href="#" class="channel_members_count_underlay overflow_ellipsis">{{pluralCount member_count "person" "people"}}</a>
		</div>
	</div>
</script>
<script id="at_channel_warning_note_template" type="text/x-handlebars-template"><i class="ts_icon ts_icon_warning ts_icon_inherit yolk_orange small_right_margin"></i> By using <span class="mention_yellow_bg">@{{keyword}}</span>, you are about to notify <strong>{{pluralCount member_count "person" "people"}}</strong>
</script>
<script id="sms_two_factor_template" type="text/x-handlebars-template"><div class="feature_modal float_none margin_auto large_bottom_margin align_center large_right_padding large_left_padding large_top_padding">
	<h1 class="medium">A New Way to Use <br>Two-Factor Authentication</h1>
	<p class="col float_none margin_auto large_bottom_margin">We've noticed you're using two-factor authentication. That's awesome! We've recently added two-factor authentication via SMS. You can now <a href="/account/settings/2fa_sms">setup two-factor authentication via SMS.</a></p>
	<a data-modal-go class="btn btn_large full_width small_bottom_margin" href="/account/settings/2fa_sms" target="_blank">Use two-factor authentication via SMS</a>
	<button data-modal-close class="btn btn_large btn_outline full_width">Cancel</button>
</div>
</script>
<script id="at_channel_blocked_note_template" type="text/x-handlebars-template"><i class="ts_icon ts_icon_lock"></i> A team owner has restricted the use of <span class="mention_yellow_bg">{{keyword}}</span> messages
</script>

<script id="fs_modal_template" type="text/x-handlebars-template"><div id="fs_modal_bg"></div>
<div id="fs_modal">
	<a id="fs_modal_back_btn" class="fs_modal_btn hidden">
		<i class="ts_icon ts_icon_arrow_large_left"></i>
		<span class="key_label">back</span>
	</a>
	<a id="fs_modal_close_btn" class="fs_modal_btn">
		<i class="ts_icon ts_icon_times"></i>
		<span class="key_label">esc</span>
	</a>
	<div class="contents_container">
		<div class="contents"></div>
	</div>
</div></script>
<script id="fs_modal_generic_contents_template" type="text/x-handlebars-template">{{#if settings.title}}
	<h1>{{settings.title}}</h1>
{{/if}}
{{#if settings.body}}
	{{{settings.body}}}
{{/if}}
<div class="actions">
	<a class="btn btn_outline dialog_cancel {{#unless settings.show_cancel_button}}hidden{{/unless}}">{{{settings.cancel_button_text}}}</a>
	<a class="btn btn dialog_secondary_go {{#if settings.secondary_go_button_class}}{{settings.secondary_go_button_class}}{{/if}} {{#unless settings.show_secondary_go_button}}hidden{{/unless}}">{{{settings.secondary_go_button_text}}}</a>
	<a class="btn dialog_go {{#if settings.go_button_class}}{{settings.go_button_class}}{{/if}} {{#unless settings.show_go_button}}hidden{{/unless}}">{{{settings.go_button_text}}}</a>
</div></script>

<script id="toggle_template" type="text/x-handlebars-template"><div class="ts_toggle {{#if settings.initial_state}}checked {{settings.on_class}}{{else}}{{settings.off_class}}{{/if}}">
	<div class="ts_toggle_button">
		<div class="ts_toggle_off_text">{{settings.off_text}}</div>
		<div class="ts_toggle_on_text">{{settings.on_text}}</div>
		<span class="ts_toggle_handle"></span>
	</div>
	<div class="ts_toggle_secondary_label">
		{{#if settings.off_label}}
			<span class="ts_toggle_off_label">{{settings.off_label}}</span>
			<span class="ts_toggle_on_label">{{settings.label}}</span>
		{{else}}
			{{settings.label}}
		{{/if}}
	</div>
</div></script>

<script id="admin_list_item_template" type="text/x-handlebars-template">	<div class="admin_list_item active member_item {{#if_equal member.is_inactive compare="1"}}{{#unless member.is_bot}}{{#unless member.is_slackbot}}inactive{{/unless}}{{/unless}}{{/if_equal}}" id="row_{{member.id}}" data-member-id="{{member.id}}" {{#if show_inactive_tip}}data-toggle="tooltip" title="This team member has not been active in Slack recently."{{/if}}>
		
		{{#if exclude_lazy_load}}
			{{{makeMemberPreviewLinkImage member.id 36 false}}}
		{{else}}
			{{{makeMemberPreviewLinkImage member.id 36 true}}}
		{{/if}}

		{{#if show_rename}}

			{{#memberIsSelf id=member.id}}
				<span class="admin_member_real_name">You{{#if member.profile.real_name}} <span class="normal"><span class="bullet">•</span> {{member.profile.real_name}}</span>{{/if}}</span>
			{{else}}
				{{#if member.profile.real_name}}
					<span class="inline_name admin_member_real_name" title="Click to edit full name">{{member.profile.real_name}}</span>
				{{else}}
					<span class="inline_name" title="Click to edit">{{#isMobileWeb}}Tap{{else}}Click{{/isMobileWeb}} to add a full name</span>
				{{/if}}
			{{/memberIsSelf}}

			<form class="inline_name_edit_form hidden inline_block no_bottom_margin" onsubmit="TS.web.admin.submitNameForm('{{member.id}}');">
				{{! no need for crumb_input }}
				<input type="text" name="first_name" placeholder="First name" value="{{member.profile.first_name}}" />
				<input type="text" name="last_name" placeholder="Last name" value="{{member.profile.last_name}}" />
				{{#isMobileWeb}}
				{{else}}
					<span class="mini"><a onclick="$(this).closest('form').submit();">save</a> or <a onclick="TS.web.admin.cancelNameForm('{{member.id}}');">cancel</a></span>
				{{/isMobileWeb}}
			</form>

		{{else}}

			{{#if member.profile.real_name}}
				<span class="admin_member_real_name">{{member.profile.real_name}}</span>
			{{else}}
				No real name set
			{{/if}}

		{{/if}}

		<br />

		<span class="admin_member_username_and_email">

			<span class="indifferent_grey{{#if show_username_edit}} inline_username{{/if}}" {{#if show_username_edit}}title="Click to edit username"{{/if}}>@{{member.name}}</span>

			{{#if show_username_edit}}
				{{#if member.username_is_editable}}
				<form class="inline_username_edit_form hidden inline_block no_bottom_margin" onsubmit="TS.web.admin.submitUsernameForm('{{member.id}}')">
					{{! no need for crumb_input }}
					<input type="text" name="username" placeholder="Username" value="{{member.name}}" maxlength="21" required />
					{{#isMobileWeb}}
					{{else}}
						<span class="mini"><a onclick="$(this).closest('form').submit();">save</a> or <a onclick="TS.web.admin.cancelUsernameForm('{{member.id}}');">cancel</a></span>
					{{/isMobileWeb}}
				</form>
				{{/if}}
			{{/if}}

			{{#unless member.is_bot}}
				<span class="bullet">•</span>
				<span{{#if show_email_edit}} class="inline_email" title="Click to edit email"{{/if}}>{{member.profile.email}}</span>
			{{/unless}}

		</span>

		{{#if show_email_edit}}
			{{#if member.email_is_editable}}
			<form class="inline_email_edit_form hidden inline_block no_bottom_margin" onsubmit="TS.web.admin.submitEmailForm('{{member.id}}')">
				{{! no need for crumb_input }}
				<input type="email" name="email" placeholder="Email address" value="{{member.profile.email}}" required />
				{{#isMobileWeb}}
				{{else}}
					<span class="mini"><a onclick="$(this).closest('form').submit();">save</a> or <a onclick="TS.web.admin.cancelEmailForm('{{member.id}}');">cancel</a></span>
				{{/isMobileWeb}}
			</form>
			{{/if}}
		{{/if}}

		{{#if member.email_pending}}
			<span title="A confirmation email has been sent to this address." class="inline_email_pending">(pending: {{member.email_pending}})</span>
		{{/if}}

		<span class="admin_member_type show_pill_action">

			{{#if member.has_sso_token}}<span title="Has SSO token" class="small_right_margin two_factor_auth_badge">SSO <i class="ts_icon ts_icon_check_circle_o"></i></span>{{/if}}

			{{#if member.two_factor_auth_enabled}}<span title="Two factor authentication enabled" class="small_right_margin two_factor_auth_badge">2FA <i class="ts_icon ts_icon_check_circle_o"></i></span>{{/if}}

			{{#if member_status}}<em class="subtle_silver">{{member_status}}</em>{{/if}}
			{{#if member.is_restricted}}
				{{#if member.deleted}}
					{{member_type}}
				{{else}}
					{{#if member.is_ultra_restricted}}
						{{#each member.channels}}
							<a class="channel pill inline_block api_change_ura_channel" title="Change the channel that {{../member.name}} can access">#{{this}} <i class="ts_icon ts_icon_pencil ts_icon_inherit pill_action edit"></i></a>
						{{/each}}
						{{#each member.groups}}
							<a class="group pill inline_block api_change_ura_channel" title="Change the {{groupCopy skip_private=true}} that {{../member.name}} can access">{{this}} <i class="ts_icon ts_icon_pencil ts_icon_inherit pill_action edit"></i></a>
						{{/each}}
						{{#if member.more_groups}}
							<a class="group pill inline_block api_change_ura_channel" title="Change the {{groupCopy skip_private=true}} that {{../member.name}} can access">{{privateGroupCopy caps=true}} <i class="ts_icon ts_icon_pencil ts_icon_inherit pill_action edit"></i></a>
						{{/if}}
					{{else}}
						<span class="mini">
							Belongs to
							{{#feature flag="feature_private_channels"}}
								{{#if channels_count}}
									{{channels_count}} public {{pluralize channels_count "channel" "channels"}}
								{{/if}}
								{{#if group_count}}
									{{#if channels_count}}and{{/if}}
									{{group_count}} private {{pluralize group_count "channel" "channels"}}
								{{/if}}
							{{else}}
							{{#if channels_count}}
								{{channels_count}} {{pluralize channels_count "channel" "channels"}}
							{{/if}}
							{{#if group_count}}
								{{#if channels_count}}and{{/if}}
								{{group_count}} {{pluralize group_count "group" "groups"}}
							{{/if}}
							{{/feature}}
						</span>
					{{/if}}
				{{/if}}
			{{else}}
				{{member_type}}
			{{/if}}
		</span>

		{{#unless omit_caret}}
			<i class="admin_member_caret ts_icon ts_icon_caret_right"></i>
			<i class="admin_member_caret ts_icon ts_icon_caret_down"></i>
		{{/unless}}

		<div class="member_actions clearfix">
			{{#if actions}}
				{{#if actions.activate}}
					{{#if paid_team}}
						{{#unless member.is_restricted}}<a class="api_enable_account btn btn_outline btn_small btn_outline btn_small">Enable Account</a>{{/unless}}
					{{else}}
						<a class="api_enable_account btn btn_outline btn_small btn_outline btn_small">{{#if member.is_restricted}}Enable as Full Team Member{{else}}Enable Account{{/if}}</a>
					{{/if}}
					{{#isMobileWeb}}{{else}}<span class="sub_actions">{{/isMobileWeb}}
						{{#if paid_team}}
							<a class="api_enable_ra {{#isMobileWeb}}btn btn_outline btn_small{{else}}sub_action{{/isMobileWeb}}">Enable {{#if member.is_ultra_restricted}}Single-channel Guest{{else}}Restricted Account{{/if}}</a>
						{{/if}}
					{{#isMobileWeb}}{{else}}{{#if actions.deactivate}}{{else}}</span>{{/if}}{{/isMobileWeb}}
				{{/if}}
				{{#if actions.enableBot}}
					<a class="api_enable_bot btn btn_outline btn_small btn_outline btn_small">Enable Account</a>
				{{/if}}
				{{#if member.is_restricted}}
					{{#if actions.unrestrict}}
						<a class="api_unrestrict_account btn btn_outline btn_small btn_outline btn_small">Make full team member</a>
					{{/if}}
					{{#if actions.convert_to_ra}}
						{{#isMobileWeb}}{{else}}<span class="sub_actions">{{/isMobileWeb}}
							<a class="api_set_restricted {{#isMobileWeb}}btn btn_outline btn_small{{else}}sub_action{{/isMobileWeb}}">Convert to Restricted Account</a>
						{{#isMobileWeb}}{{else}}{{#if actions.deactivate}}{{else}}</span>{{/if}}{{/isMobileWeb}}
					{{/if}}
					{{#if actions.convert_to_ura}}
						{{#isMobileWeb}}{{else}}<span class="sub_actions">{{/isMobileWeb}}
							<a class="admin_member_restrict_link_ura {{#isMobileWeb}}btn btn_outline btn_small{{else}}sub_action{{/isMobileWeb}}">Convert to Single-channel Guest</a>
						{{#isMobileWeb}}{{else}}{{#if actions.deactivate}}{{else}}</span>{{/if}}{{/isMobileWeb}}
					{{/if}}
				{{else}}
					{{#unless actions.activate}}
						{{#if actions.admin}}
							<a class="api_make_admin btn btn_outline btn_small btn_outline btn_small">Make an Admin</a>
						{{/if}}
						{{#if actions.owner}}
							<a class="api_make_owner btn btn_outline btn_small btn_outline btn_small">Make an Owner</a>
						{{/if}}
					{{/unless}}
					{{#if actions.deadmin}}
						<a class="api_remove_admin btn btn_outline btn_small btn_outline btn_small">Remove Admin Privileges</a>
					{{/if}}
					{{#if actions.deowner}}
						<a class="api_remove_owner btn btn_outline btn_small btn_outline btn_small">Remove Ownership</a>
					{{/if}}
					{{#if actions.restrict}}
						{{#isMobileWeb}}{{else}}<span class="sub_actions">{{/isMobileWeb}}
							{{#if paid_team}}
								<a class="admin_member_restrict_link {{#isMobileWeb}}btn btn_outline btn_small{{else}}sub_action{{/isMobileWeb}}">Restrict this account</a>
							{{else}}
								<a class="admin_member_restrict_link_unpaid {{#isMobileWeb}}btn btn_outline btn_small{{else}}sub_action{{/isMobileWeb}}">Restrict this account</a>
							{{/if}}
						{{#isMobileWeb}}{{else}}{{#if actions.deactivate}}{{else}}</span>{{/if}}{{/isMobileWeb}}
					{{/if}}
				{{/if}}
				{{#if actions.deactivate}}
						{{#isMobileWeb}}{{else}}{{#if actions.restrict}}<span class="bullet">•</span>{{else}}{{#if actions.convert_to_ura}}<span class="bullet">•</span>{{else}}<span class="sub_actions">{{/if}}{{/if}}{{/isMobileWeb}}
						{{#if member.two_factor_auth_enabled}}
							<a class="admin_member_disable_2fa_link {{#isMobileWeb}}btn btn_outline btn_small{{else}}sub_action{{/isMobileWeb}}" title="Disable two factor verification for this account">Disable 2FA</a> <span class="bullet">•</span>
						{{/if}}
						<a class="api_disable_account {{#isMobileWeb}}btn btn_outline btn_small{{else}}sub_action{{/isMobileWeb}}">Disable Account</a>
						{{#isMobileWeb}}{{else}}{{#if actions.sso_bind}}{{else}}</span>{{/if}}{{/isMobileWeb}}
				{{/if}}
				{{#if actions.sso_bind}}
						{{#isMobileWeb}}{{else}}{{#if actions.deactivate}}<span class="bullet">•</span>{{else}}<span class="sub_actions">{{/if}}{{/isMobileWeb}}
						<a class="api_sso_bind {{#isMobileWeb}}btn btn_outline btn_small{{else}}sub_action{{/isMobileWeb}}">Send SSO binding email</a>
					</span>
				{{/if}}
				{{#if member.is_bot}}
					<span class="sub_actions"{{#if actions.deactivate}} style="margin-right:0.25em"{{/if}}>
						<a href="/services/{{member.profile.bot_id}}" class="{{#isMobileWeb}}btn btn_outline btn_small{{else}}sub_action{{/isMobileWeb}}">Configure</a>
						{{#if actions.deactivate}}
							{{#isMobileWeb}}{{else}}<span class="bullet">•</span>{{/isMobileWeb}}
						{{/if}}
					</span>
				{{else}}
					{{#if member.is_slackbot}}
						<span class="sub_actions">
							<a href="/services/{{member.profile.bot_id}}" class="{{#isMobileWeb}}btn btn_outline btn_small{{else}}sub_action{{/isMobileWeb}}">Configure</a>
							{{#if actions.deactivate}}
								{{#isMobileWeb}}{{else}}<span class="bullet">•</span>{{/isMobileWeb}}
							{{/if}}
						</span>
					{{/if}}
				{{/if}}
			{{else}}
				{{#if show_transfer_btn}}
					<a href="/admin/transfer" class="btn btn_outline btn_small btn_outline btn_small">Transfer team ownership</a>

					{{#memberIsSelf id=member.id}}
						To make edits, see your <a href="/account/settings">account settings</a>.
					{{/memberIsSelf}}
				{{else}}
					{{#memberIsSelf id=member.id}}
						{{#if show_username_edit}}
							{{#if show_email_edit}}
								There aren't any actions for you to take on yourself. Click your name or email address to edit.
							{{else}}
								There aren't any actions for you to take on yourself. Click your name to edit. To edit your email, see your <a href="/account/settings">account settings</a>.
							{{/if}}
						{{else}}
							There aren't any actions for you to take on yourself. To make edits, see your <a href="/account/settings">account settings</a>.
						{{/if}}
					{{else}}
						{{#if show_email_edit}}
							{{#if show_username_edit}}
								There aren't any actions for you to take on <strong>@{{member.name}}</strong> ({{member_type}}). Click their name or email address to edit.
							{{else}}
								There aren't any actions for you to take on <strong>@{{member.name}}</strong> ({{member_type}}). Click their email address to edit.
							{{/if}}
						{{else}}
							{{#if show_username_edit}}
								There aren't any actions for you to take on <strong>@{{member.name}}</strong> ({{member_type}}). Click their name to edit.
							{{else}}
								There aren't any actions for you to take on <strong>@{{member.name}}</strong> ({{member_type}}).
							{{/if}}
						{{/if}}
					{{/memberIsSelf}}
				{{/if}}
			{{/if}}
			{{#if paid_team}}
				{{#if member.is_restricted}}
					{{#if member.is_ultra_restricted}}
						{{#if member.deleted}}
							<p class="small_bottom_margin small_top_margin show_pill_action">
								{{#each member.channels}}
									<a class="channel pill inline_block api_change_ura_channel" title="Change the channel that {{../member.name}} can access">#{{this}} <i class="ts_icon ts_icon_pencil ts_icon_inherit pill_action edit"></i></a>
								{{/each}}
								{{#each member.groups}}
									<a class="group pill inline_block api_change_ura_channel" title="Change the {{groupCopy skip_private=true}} that {{../member.name}} can access">{{this}} <i class="ts_icon ts_icon_pencil ts_icon_inherit pill_action edit"></i></a>
								{{/each}}
								{{#if member.more_groups}}
									<a class="group pill inline_block api_change_ura_channel" title="Change the {{groupCopy skip_private=true}} that {{../member.name}} can access">{{privateGroupCopy caps=true}} <i class="ts_icon ts_icon_pencil ts_icon_inherit pill_action edit"></i></a>
								{{/if}}
							</p>
						{{/if}}
					{{else}}
						<p class="small_bottom_margin small_top_margin pill_container">
							{{#if_gt ../total_memberships compare=1}}<span class="show_pill_action">{{/if_gt}}
								{{#each member.channels}}
									<span class="channel pill">#{{this}}{{#if_gt ../total_memberships compare=1}}{{#canUserKickFromChannels}} <i class="ts_icon ts_icon_times_circle pill_action api_channel_kick" data-channel-id="{{@key}}" title="Remove {{../../member.name}} from #{{this}}"></i>{{/canUserKickFromChannels}}{{/if_gt}}</span>
								{{/each}}
								{{#each member.groups}}
									<span class="group pill">{{this}}{{#if_gt ../total_memberships compare=1}}{{#canUserKickFromGroups}} <i class="ts_icon ts_icon_times_circle pill_action api_group_kick" data-group-id="{{@key}}" title="Remove {{../../member.name}} from {{this}}"></i>{{/canUserKickFromGroups}}{{/if_gt}}</span>
								{{/each}}
							{{#if_gt ../total_memberships compare=1}}</span>{{/if_gt}}
							{{#if show_add_channel_btn}}
								<a class="channel pill api_channel_invite"><i class="ts_icon ts_icon_plus"></i></a>
							{{/if}}
							{{#if member.more_groups}}
								+{{member.more_groups}} {{#if groups_count}}other{{/if}} {{#feature flag="feature_private_channels"}}private {{pluralize member.more_groups "channel" "channels"}}{{else}}{{pluralize member.more_groups "group" "groups"}}{{/feature}}
							{{/if}}
						</p>
					{{/if}}
				{{/if}}
			{{/if}}
		</div>

		<div class="notice_processing">Updating ...</div>
		<div class="notice_success">
			<span class="success_message"></span>
			<a class="notice_dismiss neutral_white">Okay</a>
		</div>
		<div class="notice_error">
			<span class="error_message">
				<span class="error_generic">Oops! There was an error performing your action.</span> <span class="error_detail"></span>
			</span>
			<span class="notice_dismiss neutral_white">Try again</span>
		</div>

	</div>
</script>
</script>
<script id="admin_invite_list_item_template" type="text/x-handlebars-template">	<div class="admin_list_item active member_item invite_item {{#if invite.is_pending}}pending{{/if}} {{#if invite.bouncing}}bouncing{{/if}}" id="row_{{invite.id}}" data-invite-id="{{invite.id}}">

		{{#if member}}
			{{{makeMemberPreviewLinkImage member.id 36}}}
			{{#if member.real_name}}
				<span class="admin_member_real_name">{{member.real_name}}</span><br />
			{{/if}}
		{{/if}}
		
		{{#if display_invite_name}}
			<span class="admin_member_real_name">{{invite.first_name}} {{invite.last_name}}</span><br />
		{{/if}}

		<span class="admin_member_username_and_email">
			{{#if member}}
				<a href="/team/{{member.name}}" class="indifferent_grey">@{{member.name}}</a> <span class="bullet">•</span> 
			{{/if}}
			{{#if invite}}
				{{#if invite.type}}
					{{invite_type_label}} <span class="bullet">•</span>
				{{/if}}
			{{/if}}
			<span class="email">{{invite.email}}</span>
			{{#if invite.bouncing}}<span class="bullet">•</span> email address bounced{{/if}}
		</span>

		<span class="admin_invite_sent_date">
			{{#if invite.is_pending}}
				{{#if_equal invite.date_resent compare="0"}}
					Invited {{toCalendarDateOrNamedDayShort invite.date_create}}</span>
				{{else}}
					Resent {{toCalendarDateOrNamedDayShort invite.date_resent}}</span>
				{{/if_equal}}
			{{else}}				
				Joined {{toCalendarDateOrNamedDayShort invite.date_create}}
			{{/if}}
		</span>
		
		{{#if invite.is_pending}}
			<i class="admin_member_caret ts_icon ts_icon_caret_right"></i>
			<i class="admin_member_caret ts_icon ts_icon_caret_down"></i>

			<div class="member_actions">
				<a href="/admin/invites?revoke={{invite.id}}&{{crumb_key}}" class="btn btn_outline btn_small">Revoke Invitation</a>
				<a href="/admin/invites?resend={{invite.id}}&{{crumb_key}}" class="btn btn_outline btn_small">Resend Invitation</a>
			</div>
		{{/if}}
	</div>
</script>
<script id="admin_invite_row_template" type="text/x-handlebars-template"><div id="invite_{{index}}" class="admin_invite_row clearfix">
	<div class="col span_1_of_2">
		<label class="email full_width">
			Email Address<br />
			<input type="text" class="email_field small full_width" name="email_address" placeholder="{{placeholder_email_address}}" />
		</label>
		<p class="error_msg input_note hidden moscow_red no_bottom_margin"></p>
	</div>
	<div class="col span_1_of_2">
		<div class="col span_1_of_2 mobile_col small_right_padding">
			<label class="full_width">
				First Name<br />
				<input type="text" name="first_name" placeholder="(optional)" class="small small_right_margin no_bottom_margin full_width" maxlength="200"/>
			</label>
		</div>
		<div class="col span_1_of_2 mobile_col float_right">
			<label class="full_width">
				Last Name<br />
				<input type="text" name="last_name" placeholder="(optional)" class="small no_bottom_margin full_width" maxlength="200"/>
			</label>
		</div>
	</div>
	
	<a class="delete_row {{#unless show_delete_btn}}hidden{{/unless}}" data-action="admin_invites_delete_row"><i class="ts_icon ts_icon_times"></i></a>
</div></script>
<script id="admin_invite_modal_template" type="text/x-handlebars-template"><div id="admin_invites_container">

	<h1 id="admin_invites_header" class="light align_center severe_grey" data-action="open_switcher">
		<i class="ts_icon ts_icon_paper_plane clear_blue float_none small_right_margin hide_on_mobile"></i> 
		Invite <span class="admin_invites_header_type">people</span><span class="admin_invites_header_team_name"> to <span class="normal">{{team_name}}</span></span>
	</h1>

	<div id="admin_invites_switcher">
		{{> admin_invite_switcher}}
	</div>
	
	<div id="admin_invites_workflow" class="hidden top_margin">

		<div id="admin_invites_channel_picker_container"></div>

		<form id="individual_invites">

			<input type="hidden" name="account_type" id="account_type" value="full" />

			<p class="alert alert_info" id="invite_notice" style="display: none;"></p>
			
			<div id="invite_rows"></div>
			
			<p id="admin_invites_add_row" class="clear_both clearfix">
				<a data-action="admin_invites_add_row" class="float_left bold">+ Add another</a>
				<span class="float_right">
				Big team to invite? <a data-action="admin_invites_switch_view" data-view="bulk" class='bold underline'>Invite many people at once.</a>
			</p>

			<button type="submit" id="admin_invites_submit_btn" class="btn btn_large ladda-button" data-action="api_send_invites" data-style="expand-right"><span class="ladda-label">Invite People</span></button>

			<p id="admin_invites_billing_notice" class="hidden small subtle_silver align_center">
				You'll be charged a pro-rated amount for each new member. See our <a href="https://slack.zendesk.com/hc/en-us/articles/201723133-Billing-FAQ" target="new" class="bold">Billing FAQ</a>.</p>
			</p>

		</form>

		<form id="bulk_invites" class="hidden stacked top_margin">

			<p class="alert alert_warning hidden" id="bulk_notice"></p>

			<label class="full_width">
				Enter multiple email addresses
				<textarea wrap="virtual" name="emails" id="bulk_emails" class="no_bottom_margin full_width"></textarea>
			</label>
			<p class="input_note"><strong>Tip:</strong> you can copy and paste a list of contacts from your email client.</p>

			<button type="submit" class="btn small_right_margin ladda-button" data-action="api_parse_emails" data-style="expand-right">Add Invitees</button>
			<a class="btn btn_outline" data-action="admin_invites_switch_view" data-view="individual">Cancel</a>
		</form>

	</div>

	<div id="admin_invites_success" class="hidden">
		{{> admin_invite_summary}}
	</div>

</div></script>
<script id="admin_invite_channel_picker_template" type="text/x-handlebars-template">{{#if_equal invite_type compare='full'}}
	<p id="default_channels_note" class="small align_center no_bottom_margin">
		New <strong>full members</strong> will automatically join
		{{#each default_channels}}
			{{#if @last}}{{#unless @first}}and {{/unless}}{{/if}}#<strong>{{this.name}}</strong>{{#unless @last}}{{#if_gt ../../default_channels.length compare=2}},{{/if_gt}}{{/unless}}
		{{/each}}
		<a onclick="$('#default_channels_note').hide(); $('#default_channels').show();" class="small_left_margin subtle_silver underline">edit / add</a>
	</p>
	<p id="default_channels" style="display: none; overflow: visible !important;">
		<select multiple="multiple" id="defaultchannelsmulti" name="defaultchannels[]" class="hidden">
			{{#each channels}}
				{{#unless this.is_general}}
					<option value="{{this.id}}"{{#if this.is_default}} selected{{/if}}>#{{this.name}}</option>
				{{/unless}}
			{{/each}}
			{{#each groups}}
				<option value="{{this.id}}">{{this.name}}</option>
			{{/each}}
		</select>
		<span class="small align_center">
			New <strong>full members</strong> will automatically join these channels and <strong>#{{general_name}}</strong> <a href="/admin/settings#default_channels" target="admin_settings" class="small_left_margin subtle_silver underline">change defaults</a>
		</span>
	</p>
{{/if_equal}}

{{#if_equal invite_type compare='restricted'}}
	<p class="small align_center small_bottom_margin">New <strong>restricted accounts</strong> will only have access to these {{channelsAndGroupsCopy}}:</p>
	<p id="restricted_channel_picker_container">
		<select multiple="multiple" id="defaultchannelsmulti" name="defaultchannels[]" data-placeholder="Choose one or more {{channelsOrGroupsCopy}} ...">
			{{#each channels}}
				<option value="{{this.id}}">#{{this.name}}</option>
			{{/each}}
			{{#each groups}}
				<option value="{{this.id}}">{{this.name}}</option>
			{{/each}}
		</select>
	</p>
{{/if_equal}}

{{#if_equal invite_type compare='ultra_restricted'}}
	<p class="small align_center small_bottom_margin">New <strong>single-channel guests</strong> will only have access to this {{channelOrGroupCopy}}:</p>
	<p id="ultra_restricted_channel_picker_container">
		<select id="ultra_restricted_channel_picker" name="ultra_restricted_channel_picker" class="full_width">
			<option value="" selected="selected">Choose a {{channelOrGroupCopy}} ...</option>
			{{#if channels}}
				<optgroup label="Channels">
					{{#each channels}}
						<option value="{{this.id}}">#{{this.name}}</option>
					{{/each}}
				</optgroup>
			{{/if}}
			{{#if groups}}
				<optgroup label="{{privateGroupsCopy caps=true}}">
					{{#each groups}}
						<option value="{{this.id}}">{{this.name}}</option>
					{{/each}}
				</optgroup>
			{{/if}}
		</select>
	</p>
{{/if_equal}}

<p class="small align_center no_bottom_margin">
	<span id="sso_signup_notice" class="hidden">
		Invited users must create their account using their SSO login.
	</span>
	<span id="google_auth_email_domain_notice" class="hidden">
		You can invite people with email addresses ending in 
		{{#each email_domains}}
			{{#if @last}}{{#unless @first}}and {{/unless}}{{/if}}<strong>@{{this}}</strong>{{#unless @last}},{{/unless}}
		{{/each}}
		<a href="/admin/auth/google" target="{{newWindowName}}" class="subtle_silver small_left_margin underline">change SSO settings</a>
	</span>
</p></script>
<script id="admin_invite_summary_template" type="text/x-handlebars-template"><h1 class="light align_center severe_grey">
	{{#if error_invites}}
		{{#if success_invites}}
			That was only a partial success.
		{{else}}
			That didn't work!
		{{/if}}
	{{else}}
		Your invitation{{#if_gt success_invites.length compare=1}}s have{{else}} has{{/if_gt}} been sent!
	{{/if}}
</h1>

<p class="align_center large_bottom_margin">
	{{#if error_invites}}
		{{#if success_invites}}
			You've invited {{{success_invites_html}}}, but 
		{{/if}}
		<span class="bold">{{error_invites.length}} {{pluralize error_invites.length 'invitation' 'invitations'}} didn't send</span>. Review the errors below.
	{{else}}
		You've invited {{{success_invites_html}}} to {{team_name}}.
	{{/if}}
</p>

{{#if success_invites}}
	<table class="addresses large_bottom_margin align_left full_width">
		<tr>
			<th class="span_1_of_2">Email Address</th>
			<th class="span_1_of_2">Name</th>
		</tr>
		{{#each success_invites}}
			<tr>
				<td class="align_top">{{this.email}}</td>
				<td>{{this.first_name}} {{this.last_name}}</td>
			</tr>
		{{/each}}
	</table>
{{/if}}

{{#if error_invites}}
	<table class="addresses error large_bottom_margin align_left full_width">
		<tr>
			<th class="span_1_of_2">Email Address</th>
			<th class="span_1_of_2">What went wrong</th>
		</tr>
		{{#each error_invites}}
			<tr>
				<td class="align_top">{{this.email}}</td>
				<td>{{this.error_msg}}</td>
			</tr>
		{{/each}}
	</table>
{{/if}}

{{#if domains}}
	<div class="alert alert_success no_bottom_margin clearfix">
		<i class="ts_icon ts_icon_check_circle_o"></i>
		<p class="value_proposition">You can set <strong>{{team_name}}</strong> to allow automatic sign up from anyone with a confirmed email address.</p>
		{{#if paid_team}}<p class="value_proposition">Slack will automatically charge or credit your account when active members are added to or removed from your team.</p>{{/if}}
		<p class="top_margin">
			<span class="col span_3_of_4 no_right_padding small_bottom_margin">
				<input type="text" id="invite_signup_domains" class="no_bottom_margin small" value="{{domains}}" />
			</span>
			<button class="btn ladda-button col span_1_of_4" data-style="expand-right" data-action="add_signup_domains">Set Up</button>
			<span class="input_note col span_1_of_1 no_margin">To allow email addresses from multiple domains, separate them with commas.</span>
		</p>
	</div>
{{/if}}

<p class="large_top_padding">
	<a class="btn btn_outline col span_1_of_3" href="/admin/invites" {{#isClient}}target="admin_invites"{{/isClient}}>View Pending Invites</a>
	{{#if error_invites}}
		<button class="btn btn_outline col span_1_of_3" data-action="admin_invites_try_again">Try Again</button>
	{{else}}
		<button class="btn btn_outline col span_1_of_3" data-action="admin_invites_reset">Invite More People</button>
	{{/if}}
	<button class="btn btn_outline col span_1_of_3 dialog_cancel">Done</button>
</p></script>
<script id="admin_invite_switcher_template" type="text/x-handlebars-template"><hr id="admin_invites_header_divider" class="hide_on_mobile" />		
<div class="admin_invites_account_type_option {{#if hide_full_member_option}}disabled{{/if}}" data-action="switch_type" data-account-type="full">
	<{{#isClient}}h2{{else}}h3{{/isClient}} class="normal small_bottom_margin">Full Members</{{#isClient}}h2{{else}}h3{{/isClient}}>
	<p>Full Members can access messages and files in any public channel and access the full team directory.</p>
	{{#unless hide_full_member_option}}
		<i class="option_arrow ts_icon ts_icon_arrow_right ts_icon_inherit"></i>
	{{else}}
		<div class="account_type_disabled_hover">
			<p class="bottom_margin">Full members can sign up at <strong>{{team_signup_url}}</strong></p>
			<a href="/admin/auth/saml" {{#isClient}}target="auth"{{/isClient}} class="btn btn_outline">Change SSO Settings</a>
		</div>
	{{/unless}}
</div>
<div class="admin_invites_account_type_option {{#unless team_has_paid}}disabled{{/unless}}" data-action="switch_type" data-account-type="restricted">
	<{{#isClient}}h2{{else}}h3{{/isClient}} class="normal small_bottom_margin">Restricted Accounts</{{#isClient}}h2{{else}}h3{{/isClient}}>
	<p>Restricted Accounts see a partial team directory and can only access messages and files from selected {{channelsAndGroupsCopy}}.</p>
	{{#if team_has_paid}}
		<i class="option_arrow ts_icon ts_icon_arrow_right ts_icon_inherit"></i>
	{{else}}
		<div class="account_type_disabled_hover">
			<p class="bottom_margin">Only paid teams can invite <strong>Restricted Accounts</strong>.</p>
			<a href="/pricing" {{#isClient}}target="pricing"{{/isClient}} class="btn btn_outline">Learn More</a>
			{{#currentUserIsOwner}}
				<a href="/admin/billing" {{#isClient}}target="pricing"{{/isClient}} class="btn small_left_margin">Upgrade Now</a>
			{{/currentUserIsOwner}}
		</div>
	{{/if}}
</div>
<div class="admin_invites_account_type_option {{#if team_has_paid}}{{#unless can_add_ura}}disabled{{/unless}}{{else}}disabled{{/if}}" data-action="switch_type" data-account-type="ultra_restricted">
	<{{#isClient}}h2{{else}}h3{{/isClient}} class="normal small_bottom_margin">Single-Channel Guests</{{#isClient}}h2{{else}}h3{{/isClient}}>
	<p>Single-Channel Guests can only access messages and files in a single channel. This account type is free. <a href="https://slack.zendesk.com/hc/en-us/articles/202518103-Restricted-account-and-single-channel-guest-FAQ" target="zendesk" class="subtle_silver underline">Learn more</a></p>
	{{#if team_has_paid}}
		{{#unless can_add_ura}}
			<div class="account_type_disabled_hover">
				<p class="bottom_margin">You've reached your team limit for <strong>Single-Channel Guests</strong>.</p>
				<a href="https://slack.zendesk.com/hc/en-us/articles/202518103-Restricted-account-and-single-channel-guest-FAQ" target="zendesk" class="btn btn_large btn_outline">Learn More</a>
			</div>
		{{/unless}}
		<i class="option_arrow ts_icon ts_icon_arrow_right ts_icon_inherit"></i>
	{{else}}
		<div class="account_type_disabled_hover">
			<p class="bottom_margin">Only paid teams can invite <strong>Single-Channel Guests</strong>.</p>
			<a href="/pricing" {{#isClient}}target="pricing"{{/isClient}} class="btn btn_outline">Learn More</a>
			{{#currentUserIsOwner}}
				<a href="/admin/billing" {{#isClient}}target="pricing"{{/isClient}} class="btn small_left_margin">Upgrade Now</a>
			{{/currentUserIsOwner}}
		</div>
	{{/if}}
</div></script>
<script id="admin_restricted_info_template" type="text/x-handlebars-template">	<div class="restricted_info">
		
		<p class="large_bottom_margin emphasized align_center">Give limited access to your Slack instance to contractors, clients, or friends.</p>
		
		<div class="account_type">
			<div class="restricted_account_icon"></div>
			<h3 class="no_bottom_margin">Restricted Accounts</h3>
			<p class="no_bottom_margin">Can only access {{channelsAndPrivateGroupsCopy}} that they are invited to join.</p>
			{{#if paid_team}}
				<p>
					<a data-action="admin_invites_modal" data-account-type="restricted"><i class="ts_icon ts_icon_share_email"></i> &nbsp;Invite new restricted accounts</a>
				</p>
			{{/if}}
		</div>
		<div class="account_type">
			<div class="guest_account_icon"></div>
			<h3 class="no_bottom_margin">Single-channel Guests</h3>
			<p class="no_bottom_margin">A free account with access to a single {{channelOrPrivateGroupCopy}}.</p>
			{{#if paid_team}}
				<p>
					<a data-action="admin_invites_modal" data-account-type="ultra_restricted"><i class="ts_icon ts_icon_share_email"></i> &nbsp;Invite new single-channel guests</a>
				</p>
			{{/if}}
		</div>
		
		{{#unless paid_team}}
			<div class="admin_banner">
				<h3>Both available on our Standard Plan.</h3>
				<p class="no_bottom_margin">Learn more about your <a href="/admin/billing">upgrade options</a>.</p>
			</div>
		{{/unless}}
		
	</div>	
</script>
<script id="admin_restricted_info_sso_template" type="text/x-handlebars-template">	<div class="restricted_info_sso">
		
		<p class="emphasized align_center">Because you have SSO enabled and required for all users, you do not need to invite users to your team. If they have an account with your SSO provider, they can sign in to your Slack team.</p>
		
		<p class="no_bottom_margin align_center"><a href="/admin/auth" class="btn">Manage Authentication Settings</a></p>
	</div>	
</script>
<script id="admin_restrict_account_template" type="text/x-handlebars-template">	<div class="col span_3_of_6">
	
		<h4>
		{{#if enabling}}Enable a restricted account{{else}}Restrict this account{{/if}}
		</h4>

		<p class="small_bottom_margin">
			Team members you
			{{#if enabling}} enable with a Restricted Account{{else}} convert to Restricted Accounts{{/if}}
			 will have the following capabilities:
		</p>
		<ul>
			<li>participate in the {{channelsAndGroupsCopy}} they are invited to join</li>
			<li>exchange direct messages with others in the {{channelsAndGroupsCopy}} to which they belong</li>
		</ul>
		<p class="small_bottom_margin">They will <strong>not</strong> be able to:</p>
		<ul>
			<li>create new {{channelsOrGroupsCopy}}</li>
			<li>see files or messages in {{channelsAndGroupsCopy}} they don't belong to</li>
		</ul>
		<p class="large_bottom_margin">Single-channel Guests only have access to one {{channelOrPrivateGroupCopy}}.</p>
		
		<h4>Billing</h4>
		<p class="large_bottom_margin">Restricted Accounts count as paid users when they are active. Single-channel Guests are free.</p>
		
	</div>

	<div class="col span_3_of_6 invite_form_column">

		<div id="step1" class="align_center">

			{{{makeMemberPreviewLinkImage member.id 192}}}
	
			<h3 class="top_margin">
				{{#if enabling}}
					Enable {{#if member.profile.real_name}}{{member.profile.real_name}}{{else}}{{member.name}}{{/if}} with:
				{{else}}
					Convert {{#if member.profile.real_name}}{{member.profile.real_name}}{{else}}{{member.name}}{{/if}} to:
				{{/if}}
			</h3>
	
			<a class="restriction_option" id="restricted_user">
				<i class="presence large active ra"></i> A restricted account <i class="ts_icon ts_icon_arrow_right"></i>
			</a>
			<a class="restriction_option" id="guest_user">
				<i class="presence large active ura"></i> A single-channel guest <i class="ts_icon ts_icon_arrow_right"></i>
			</a>
		
			<p class="subtle_silver large_top_margin">or <a class="cancel_admin_restrict_workflow subtle_silver">return to Team Administration</a></p>
		</div>
	
		<div id="step2_restricted" class="hidden align_center">

			{{{makeMemberPreviewLinkImage member.id 192}}}
	
			<h3 class="top_margin">
				{{#if enabling}}Enable{{else}}Convert{{/if}} {{#if member.profile.real_name}}{{member.profile.real_name}}{{else}}{{member.name}}{{/if}} {{#if enabling}}as{{else}}to{{/if}} a Restricted Account
			</h3>

			<p>
				{{#if show_ra_channel_picker}}
					You must pick one {{channelOrGroupCopy}} for this Restricted Account to join.
					(You can set additional {{channelsAndPrivateGroupsCopy}} in the next step.)
				{{else}}
					You can set the {{channelsAndPrivateGroupsCopy}} for this restricted account in the next step.
				{{/if}}
				{{#if enabling}}{{else}}<p>This change will take effect immediately.</p>{{/if}}
			</p>

			{{#if show_ra_channel_picker}}
				<p>
					<label class="select small">
						<select id="restricted_channel_picker" class="small">
							{{#if channels}}
								<optgroup label="Channels">
									{{#each channels}}
										<option value="{{this.id}}">#{{this.name}}</option>
									{{/each}}
								</optgroup>
							{{/if}}
							{{#if groups}}
								<optgroup label="{{privateGroupsCopy caps=true}}">
									{{#each groups}}
										<option value="{{this.id}}"><i class="ts_icon ts_icon_lock_o"></i> {{this.name}}</option>
									{{/each}}
								</optgroup>
							{{/if}}
						</select>
					</label>
				</p>
			{{/if}}

			<p class="error_message moscow_red hidden">Oops! There was an error performing your action.</p>
			<p>
				<a class="btn api_set_restricted btn_success">Confirm</a>
				<a class="cancel_admin_restrict_workflow btn btn_outline small_left_margin">Cancel</a>
			</p>

		</div>

		<div id="step2_guest" class="hidden align_center">

			{{{makeMemberPreviewLinkImage member.id 192}}}
	
			<h3 class="top_margin">{{#if enabling}}Enable{{else}}Convert{{/if}} {{#if member.profile.real_name}}{{member.profile.real_name}}{{else}}{{member.name}}{{/if}} {{#if enabling}}as{{else}}to{{/if}} a Single-channel Guest</h3>
	
			<p class="no_bottom_margin">With access to this {{channelOrGroupCopy}}:</p>

			<p>
				<label class="select small">
					<select id="ultra_restricted_channel_picker" class="small">
						{{#if channels}}
							<optgroup label="Channels">
								{{#each channels}}
									<option value="{{this.id}}">#{{this.name}}</option>
								{{/each}}
							</optgroup>
						{{/if}}
						{{#if groups}}
							<optgroup label="{{privateGroupsCopy caps=true}}">
								{{#each groups}}
									<option value="{{this.id}}"><i class="ts_icon ts_icon_lock_o"></i> {{this.name}}</option>
								{{/each}}
							</optgroup>
						{{/if}}
					</select>
				</label>
			</p>

			{{#if enabling}}{{else}}<p>This change will take effect immediately.</p>{{/if}}

			<p class="error_message moscow_red hidden">Oops! There was an error performing your action.</p>
		
			<p id="convert_to_ura_confirmation">
				<a class="btn api_set_ultra_restricted btn_success">Confirm</a>
				<a class="cancel_admin_restrict_workflow btn btn_outline small_left_margin">Cancel</a>
			</p>

		</div>
		
	</div>
	
</script>


<script id="account_notifications_channel_overrides_template" type="text/x-handlebars-template">	<table>
		<tr class="hide_when_no_overrides">
			<td></td>
			<td class="align_center extra_right_border" colspan="3"><i class="ts_icon ts_icon_laptop small_right_margin"></i><strong>Desktop</strong></td>
			<td class="align_center extra_left_border" colspan="3"><i class="ts_icon ts_icon_mobile small_right_margin" style="font-size: 1.4rem"></i><strong>Mobile</strong></td>
			<td></td>
		</tr>
		<tr class="hide_when_no_overrides">
			<th></th>
			<th>Everything</td>
			<th>Mentions</th>
			<th class="extra_right_border right_padding">Nothing</th>
			<th class="extra_left_border">Everything</th>
			<th>Mentions</th>
			<th>Nothing</th>
			<th class="revert_cell_width"></th>
		</tr>
		<tr id="add_override_channel_picker_row" class="hidden">
			<td colspan="8"><a id="add_override_channel_picker"><i class="ts_icon ts_icon_plus_circle ts_icon_inherit float_left small_right_margin"></i> Add a custom setting for a {{channelOrGroupCopy}}</a></td>
		</tr>
	</table>
</script>
<script id="account_notifications_channel_overrides_row_template" type="text/x-handlebars-template">	<tr id="channel_override_row_{{channel.id}}" class="channel_override_row {{#if channel.is_muted}}muted{{/if}}">
		<td class="channel_details">
			<span class="no_wrap">
				<i class="ts_icon ts_icon_bell_slash mute_icon"></i>
				{{~#if channel.is_group~}}
					{{~#if channel.is_mpim~}}
						<i class="ts_icon ts_icon_multiparty_dm_{{mpimMemberCount channel.channel}}"></i>
					{{~else~}}
						<i class="ts_icon ts_icon_lock_o group_lock_prefix"></i>
					{{~/if~}}
				{{~/if~}}
				{{~#if channel.is_channel~}}
					<span class="channel_hash_prefix">#</span>
				{{~/if~}}
				<strong>{{channel.name}}</strong>
				<span class="pref_saved inline_block small_left_margin"><i class="ts_icon ts_icon_check_circle_o"></i> Saved</span>
			</span>

			<label class="checkbox no_margin normal">
				<input id="muting_cb_{{channel.id}}" {{#if channel.is_muted}}checked="checked"{{/if}} type="checkbox" data-id="{{channel.id}}" data-pref="muting" class="small_right_margin">
				Mute this {{#if channel.is_mpim}}conversation{{else}}{{#if channel.is_group}}{{groupCopy}}{{else}}channel{{/if}}{{/if}}
			</label>

			<label id="at_channel_suppressed_{{channel.id}}" class="hidden checkbox no_margin normal {{#if channel.is_muted}}disabled{{/if}}">
				<input id="at_channel_suppressed_cb_{{channel.id}}" checked="checked" {{#if channel.is_muted}}disabled{{/if}} type="checkbox" data-id="{{channel.id}}" data-pref="at_channel_suppression" class="small_right_margin"> Suppress <strong>{{#if channel.is_group}}@{{groupCopy skip_private=true}}{{else}}{{#if channel.is_general}}@everyone{{else}}@channel{{/if}}{{/if}}</strong> mentions <span id="at_channel_suppressed_mobile_qualifier_{{channel.id}}">(on mobile)</span><span id="at_channel_suppressed_desktop_qualifier_{{channel.id}}">(on desktop)</span>
			</label>

		</td>

		<td class="radio_cell"><input type="radio" id="desktop_everything_{{channel.id}}" name="desktop_{{channel.id}}" data-id="{{channel.id}}" data-device="desktop" value="everything" {{#if channel.is_muted}}disabled{{/if}}></td>
		<td class="radio_cell"><input type="radio" id="desktop_mentions_{{channel.id}}" name="desktop_{{channel.id}}" data-id="{{channel.id}}" data-device="desktop" value="mentions" {{#if channel.is_muted}}disabled{{/if}}></td>
		<td class="radio_cell"><input type="radio" id="desktop_nothing_{{channel.id}}" name="desktop_{{channel.id}}" data-device="desktop" data-id="{{channel.id}}" value="nothing" {{#if channel.is_muted}}disabled{{/if}}></td>

		<td class="radio_cell"><input type="radio" id="mobile_everything_{{channel.id}}" name="mobile_{{channel.id}}" data-id="{{channel.id}}" data-device="mobile" value="everything" {{#if channel.is_muted}}disabled{{/if}}></td>
		<td class="radio_cell"><input type="radio" id="mobile_mentions_{{channel.id}}" name="mobile_{{channel.id}}" data-id="{{channel.id}}" data-device="mobile" value="mentions" {{#if channel.is_muted}}disabled{{/if}}></td>
		<td class="radio_cell"><input type="radio" id="mobile_nothing_{{channel.id}}" name="mobile_{{channel.id}}" data-id="{{channel.id}}" data-device="mobile" value="nothing" {{#if channel.is_muted}}disabled{{/if}}></td>

		<td class="align_center"><i class="ts_icon ts_icon_times_circle revert_to_default" data-id="{{channel.id}}" data-toggle="tooltip" title="Clear custom notification settings from {{#if channel.is_channel}}#{{/if}}{{channel.name}}"></i></td>
	</tr>
</script>
<script id="password_modal_template" type="text/x-handlebars-template"><form id="{{name}}_form" action="{{action}}" method="post" accept-encoding="UTF-8">
	<input type="password" id="{{name}}_password" name="{{name}}_password" placeholder="Password">
	<input type="hidden" name="crumb" value="{{crumb}}">
	{{#if mode}}<input type="hidden" name="{{mode}}" value="1">{{/if}}
</form>
</script>
<script id="account_secret_codes_modal_template" type="text/x-handlebars-template"><p class="alert alert_warning">
	<i class="ts_icon ts_icon_exclamation_circle code_warning"></i>If you lose access to your authentication device, you can use one of these backup codes to login to your account. Each code may be used only once. Make a copy of these codes, and store it somewhere safe.
</p>
<div class="align_center">
	<div class="backup_codes_wrapper margin_auto curved_shadow">
		<div class="backup_codes">
			<ul class="clearfix">
				{{#each codes}}<li>{{this}}</li>{{/each}}
			</ul>
		</div>
	</div>
</div></script>
<script id="two_factor_auth_modal_template" type="text/x-handlebars-template"><h1 class="medium large_top_margin medium_bottom_margin">Mandatory two factor authentication</h1>
<p>All team members (<strong>including you</strong>) who do not have two factor authentication currently enabled will be notified via Slack Bot and email to do so. New team members will be asked to configure 2FA as well.</p>
<p class="large_bottom_margin">After 24 hours, members who have not configured 2FA will be required to do so before continuing to use Slack,</p>
<p class="bottom_margin"><strong><a id="customize_toggle" class="indifferent_grey" href="#">Customize Slack Bot message <i class="ts_icon ts_icon_caret_right"></i></a></strong></p>
<div id="customize" class="customize_wrapper">
	<div class="accordion_subsection" style="display: none;">
		<div class="message_wrapper normal_padding bottom_margin">
			<div class="message show_user avatar first divider">
				<span class="member_preview_link member_image thumb_36" style="background-image: url('https://slack-assets2.s3-us-west-2.amazonaws.com/10068/img/slackbot_48.png')"></span>
				<span class="message_sender member color_USLACKBOT">Slack Bot</span>
				<span class="message_content bottom_margin">Hi, {{name}}. Your team admin, {{admin_name}}, has enabled mandatory <a href="https://slack.zendesk.com/hc/en-us/articles/204509068" target="_blank">two factor authentication</a> for your Slack team. This means that moving forward, you'll need an authentication code from your phone whenever you sign in.</span>
				<span class="message_content bottom_margin">In {{hours}} ({{time}}) you'll be asked to configure two factor authentication, but we recommend you do this now.</span>
				<span class="message_content bottom_margin"><a href="/account/settings#two_factor">Configure two factor authentication now.</a></span>
				<span class="message_content bottom_margin custom_message left_padding">[ Your custom message goes here. ]</span>
			</div>
		</div>
		<textarea name="custom_message_input" id="custom_message_input" class="custom_message_input" placeholder="Add a message&hellip;"></textarea>
	</div>
</div>
<div class="clearfix large_top_margin modal_password_form">
	<div class="span_4_of_6">
		<form action="/admin/auth/" method="post" accept-encoding="UTF-8">
			<label for="password">Your password</label>
			<input type="hidden" name="crumb" value="{{crumb}}">
			<input id="password" class="bottom_margin" type="password" placeholder="Password" name="password">
			<button id="confirm_btn" class="btn btn_large disabled">Confirm and enable</button>
		</form>
	</div>
</div>
<p class="subtle_silver align_center">Learn more about <a class="underline subtle_silver" href="">two factor authentication</a></p>
</script>

<script id="enterprise_template" type="text/x-handlebars-template"><div class="enterprise">
	<div class="enterprise_container">
		<div class="enterprise_side_container" data-name="enterprise_side_container"></div>
		<div class="enterprise_main_container" data-name="enterprise_main_container"></div>
	</div>
</div>
</script>
<script id="enterprise_menu_template" type="text/x-handlebars-template"><div class="enterprise_menu">
		<div class="enterprise_menu_container">
			<div class="enterprise_menu_team_image">
				<div class="enterprise_menu_team_image_container" style="
				background-image: url({{enterprise_image}});
				background-color: gray;
				"></div>
			</div>
			<div class="enterprise_menu_team_name" data-name="enterprise_menu_team_name">
				{{enterprise_name}}
			</div>
			<ul class="enterprise_menu_list">
				{{#each menu_items}}
					<li class="enterprise_menu_list_item 
					{{#if this.selected}}enterprise_menu_list_item_selected{{/if}}" 
					data-id={{this.id}}>
						<i class="ts_icon {{this.icon}}"
						style="color: #{{this.color}};"></i>
						<a href="{{this.url}}">{{this.name}}</a>
					</li>
				{{/each}}
			</ul>
			<ul class="enterprise_menu_sublist">
				<li><a href="">Help</a></li>
				<li><a href="">Policies</a></li>
				<li><a href="">Contact</a></li>
				<li><a href="">Sign out</a></li>
			</ul>
			<div class="enterprise_menu_footer"></div>
		</div>
	</div>
</div>
</script>
<script id="sidebar_theme_css_template" type="text/x-handlebars-template">	<style type="text/css" id="sidebar_theme_css">

		/* Column Background */
		#col_channels_bg,
		#col_channels {
			background: {{theme.column_bg}};
		}
		#monkey_scroll_wrapper_for_channels_scroller .monkey_scroll_handle_inner {
			border-color: {{theme.column_bg}};
		}

		/* Menu Background */
		#team_menu {
			background: {{theme.menu_bg}};
			color: {{theme.text_color}};
			text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);
		}
		#team_menu,
		#quick_switcher_btn,
		#team_menu_overlay,
		#col_channels_overlay {
			background: {{theme.column_bg}};
			border-color: {{theme.column_bg}};
		}
		#team_menu:hover,
		#team_menu.active,
		#quick_switcher_btn:hover,
		#quick_switcher_btn:active {
			background: {{theme.menu_bg}};
			border-color: {{theme.menu_bg}};
		}

		/* Active Item */
		#col_channels ul li.channel.active a.channel_name, 
		#col_channels ul li.group.active a.group_name, 
		#col_channels ul li.member.active a.im_name, 
		#col_channels ul li.mpim.active a.mpim_name {
			background: {{theme.active_item}};
			opacity: 1;
			color: {{theme.active_item_text}} !important;
		}
		#col_channels.channels_list_holder ul li.channel.active .unread_highlight,
		#col_channels.channels_list_holder ul li.member.active .unread_highlight,
		#col_channels.channels_list_holder ul li.group.active .unread_highlight,
		#col_channels.channels_list_holder ul li.mpim.active .unread_highlight {
			color: {{theme.active_item}};
		}
		#channel_scroll_up {
			box-shadow: 0 1px 1px rgba(0,0,0,0.25), inset 0px 2px 2px rgba(0,0,0,0.1)
		}
		#channel_scroll_down {
			box-shadow: 0 -1px 1px rgba(0,0,0,0.25), inset 0px -2px 2px rgba(0,0,0,0.1)
		}

		/* Hovered Item */
		.channels_list_holder ul li a:hover,
		#monkey_scroll_wrapper_for_channels_scroller .monkey_scroll_bar {
			background: {{theme.hover_item}};
		}

		/* Text Color */
		.channels_list_holder ul li a,
		.channels_list_holder h2,
		.list_more,
		#team_menu:before,
		.channels_list_holder ul li.channel.active a.channel_name .prefix, 
		.channels_list_holder ul li.group.active a.group_name .prefix,
		#current_user_name,
		.channels_list_holder ul li.unread .prefix,
		.channels_list_holder ul li.member .im_close, 
		.channels_list_holder ul li.mpim .mpim_close,
		.channels_list_holder ul li.group .group_close,
		#quick_switcher_btn > i {
			color: {{theme.text_color}} !important;
			opacity: 0.6;
		}
		.channels_list_new_btn {
			color: {{theme.text_color}} !important;
			opacity: 0.3;
		}
		#quick_switcher_label,
		#quick_switcher_shortcut,
		#quick_switcher_btn:hover #quick_switcher_shortcut {
			color: {{theme.text_color}} !important;
		}
		#channel_list_invites_link, #channel_list_invites_link_label {
			color: {{theme.text_color}} !important;
		}
		#channel_list_invites_link, #channel_list_invites_link:hover {
			border-color: {{theme.text_color}};
		}
		.overlay_mock_text{
			background: {{theme.text_color}} !important;
		}
		#team_menu:hover:before,
		#team_menu.active:before,
		.channels_list_holder h2.hoverable:hover {
			opacity: 1;
		}
		.channels_list_holder ul li.channel.active a.channel_name .prefix, 
		.channels_list_holder ul li.group.active a.group_name .prefix {
			color: {{theme.active_item_text}} !important;	
		}
		.list_more:hover {
			color: {{theme.text_color}} !important;
			border-bottom-color: {{theme.text_color}};
		}

		.channels_list_holder ul li.unread a,
		.channels_list_holder ul li.member .im_close, 
		.channels_list_holder ul li.mpim .mpim_close,
		.channels_list_holder ul li.group .group_close {
			opacity: 1;
		}

		#monkey_scroll_wrapper_for_channels_scroller .monkey_scroll_handle_inner {		
			background: {{theme.text_color}};
			opacity: 0.7;
		}

		/* Presence */
		#im-list .presence.active i.presence_icon, 
		#starred-list .presence.active i.presence_icon,
		#team_menu #presence.active:before,
		.slackbot_icon {
			color: {{theme.active_presence}};
			opacity: 1;
		}
		#im-list li.member.active .presence.active i.presence_icon, 
		#starred-list li.member.active .presence.active i.presence_icon,
		#im-list li.member.active .slackbot_icon, 
		#starred-list li.member.active .slackbot_icon {
			color: {{theme.active_item_text}} !important;	
		}

			/* Override for Hoth Theme presence dot on selected item. Fixes Bug #7154 */
			.sidebar_theme_hoth_theme #im-list li.member.active .presence.active i.presence_icon, 
			.sidebar_theme_hoth_theme #starred-list li.member.active .presence.active i.presence_icon,
			.sidebar_theme_hoth_theme #im-list li.member.active .slackbot_icon, 
			.sidebar_theme_hoth_theme #starred-list li.member.active .slackbot_icon {
				color: {{theme.active_presence}} !important;	
			}

		#im-list li.member.active .presence.away i.presence_icon, 
		#starred-list li.member.active .presence.away i.presence_icon {
			color: {{theme.active_item_text}} !important;
			opacity: 0.3;
		}
		#im-list .presence.away,
		#starred-list .presence.away,
		#team_menu #presence.away:before {
			color: {{theme.text_color}};
			opacity: 0.3;
		}

		/* Badge + Mentions bar */
		.channels_list_holder .unread_highlight,
		#channel_scroll_up.unseen_have_mentions, 
		#channel_scroll_down.unseen_have_mentions,
		#omnibox .omnibox_item .unread_highlight_cnt {
			background: {{theme.badge}};
		}

		/* No text shadows */
		#col_channels a,
		#team_menu {
			text-shadow: none !important;
		}

	</style>
</script>

<script id="billing_contact_template" type="text/x-handlebars-template">	<div class="billing_contact {{#if member.is_primary_owner}}primary_owner{{/if}} {{#if member.deleted}}inactive{{/if}}" data-contact-id="{{contact.id}}">
		{{#if member}}
			{{{makeMemberPreviewLinkImage member.id 48}}}
			<div class="inline_block" style="margin-left: 8px">
				<div class="no_wrap">
					<strong>{{#if member.is_self}}You &bull; {{/if}}{{getMemberDisplayName member}}</strong>
					{{#if member.deleted}}&bull; <em class="subtle_silver">(Disabled)</em>{{/if}}
				</div>
				<div>{{member_type}} {{#unless member.is_primary_owner}}&bull; {{member.profile.email}}{{/unless}}</div>
			</div>
			{{#if is_primary_and_self}}
				<label class="checkbox primary_owner_toggle_label" for="primary_owner_toggle">
					<input id="primary_owner_toggle" type="checkbox"> Send billing emails to you at <strong>{{member.profile.email}}</strong>
				</label>
			{{/if}}
		{{else}}
			<div class="inline_block" style="margin-left: 56px">
				<div class="no_wrap"><strong>{{contact.email}}</strong></div>
				<div>Billing Contact</div>
			</div>
		{{/if}}
		{{#unless member.is_primary_owner}}
			<a class="remove_contact"><i class="ts_icon ts_icon_times float_right"></i></a>
		{{/unless}}
	</div>
</script>
<script id="billing_add_contact_form_template" type="text/x-handlebars-template">	<div id="add_contact_form" class="top_margin">
		<div>
			<div>Add a billing contact from your team:</div>
			<div class="add_contact_input">
				<select id="user_contact_select" multiple data-placeholder="Type the new billing contact's name">
					{{#each members}}
						<option value="{{id}}">{{#if real_name}}{{real_name}} &bull;{{/if}} {{name}}</option>
					{{/each}}
				</select>
			</div>
		</div>

		<div class="small_top_margin">
			<div>Or by email address:</div>
			<input id="email_contact_input" class="add_contact_input small no_bottom_margin" type="text" placeholder="name@domain.com">
		</div>

		<button class="btn ladda-button top_margin" data-style="expand-right"><span class="ladda-label">Add billing contact</span></button>
	</div>
</script>

<script id="bank_account_verification_dialog_template" type="text/x-handlebars-template">	<p>Enter the number of cents (between 1 and 100) of the two deposits here to verify your account. </p>
	<input type="text" name="value1" id="value1" placeholder="deposit 1">
	<input type="text" name="value2" id="value2" placeholder="deposit 2">
	<p class="mini">Within 1-2 business days of adding your bank account, you will receive two small deposits in your account with statement description <code>VERIFICATION</code>.</p></script>

	<script id="spaces_connected_members_template" type="text/x-handlebars-template"><div class="connected_members_count_container">
    {{>spaces_connected_member_count}}
</div>

<ul class="members">
    {{! Note: whitespace inside of #each will cause elements to jump around when the tooltip
              is first shown.
        TODO: unify this with spaces_connected_member_template, below.
    }}
	{{#each members}}
        <li>{{{makeMemberImage this.id 72 false true}}}</li>
    {{/each}}

    {{#has_more_count}}
        <li><button class="toggle_more_members_popover" data-has-tooltip="true" title="Click to show {{more_count}} other viewers">{{more_count}}</button></li>
    {{/has_more_count}}
</ul>
</script>
	<script id="spaces_connected_member_count_template" type="text/x-handlebars-template"><p class="connected_members_count">Also viewing</p></script>
	<script id="spaces_connected_member_overflow_popover_template" type="text/x-handlebars-template"><ul class="member_overflow">
    {{#each members}}
        <li class="overflow_ellipsis">{{#if this.real_name}}{{this.real_name}}{{else}}{{this.name}}{{/if}}</li>
    {{/each}}
</ul>
</script>
	<script id="spaces_connected_member_template" type="text/x-handlebars-template">{{{makeMemberImage member.id 72 false true}}}</script>
	<script id="spaces_link_popover_template" type="text/x-handlebars-template">	<div class="textstyle_menu link {{#show_unfurl}}has_unfurl_button{{/show_unfurl}}">
		<input type="text" placeholder="e.g. www.slack.com"></input>
		<a class="link tsm_edit_link" target="_blank"></a>
		<div class="buttons">
			<a data-toggle="tooltip" class="item link_unfurl" data-which="unfurl" title="Unfurl link"><span></span></a>
			<a data-toggle="tooltip" class="item link_remove" data-which="remove" title="Remove link"><span></span></a>
			<a data-toggle="tooltip" class="item link_edit" data-which="edit" title="Edit link address"><span></span></a>
			<a data-toggle="tooltip" class="item link_ok" data-which="okay" title="Save changes"><span></span></a>
		</div>
	</div>
</script>
	<script id="spaces_shared_in_template" type="text/x-handlebars-template">{{! Note: whitespace before the closing </li> tags will add spacing before the comma separating
          the items, so be careful. }}
{{#if public_link}}
	<li>
		shared <a href="{{public_link}}" class="space_toggle_public_url" target="public_{{public_link}}">publicly</a>
		{{#if can_unshare}}<a class="unshare_link" onclick="TS.web.file.revokePublicURL(TS.files.getFileById('{{file_id}}'))" data-toggle="tooltip" title="Revoke the public URL"><i class="ts_icon ts_icon_minus_circle_small"></i></a>{{/if}}{{#if shared_in}} and in{{/if}}
	</li>
{{else}}
	<li>shared in</li>
{{/if}}
{{#each shared_in}}
	<li class="list">{{{makeChannelOrGroupLinkById this}}} {{#if ../can_unshare}}{{{makeUnshareLinkById this}}}{{/if}}</li>
{{/each}}
{{#has_overflow}}
	<li><a href="javascript:void(0)" class="show_overflow">{{overflow_count}} more</a></li>
{{/has_overflow}}
</script>
	<script id="shortcuts_spaces_dialog_template" type="text/x-handlebars-template">	<button class="close" data-dismiss="modal" aria-hidden="true"><i class="ts_icon ts_icon_times"></i></button>

	<div class="modal-body">
		<div class="col">
			<h2>Formatting shortcuts</h2>
			<ul class="no_bullets">
				<li>Heading 1: <span class="keyboard">{{meta_key}}</span><span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">1</span></li>
				<li>Heading 2: <span class="keyboard">{{meta_key}}</span><span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">2</span></li>
				<li>Heading 3: <span class="keyboard">{{meta_key}}</span><span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">3</span></li>
			</ul>
			<ul class="no_bullets">
				<li>Bulleted list: <span class="keyboard">{{cmd_key}}</span><span class="keyboard">Shift</span><span class="keyboard">8</span></li>
				<li>Numbered list: <span class="keyboard">{{cmd_key}}</span><span class="keyboard">Shift</span><span class="keyboard">7</span></li>
				<li>Checklist: <span class="keyboard">{{cmd_key}}</span><span class="keyboard">Shift</span><span class="keyboard">9</span></li>
				<li>Code block: <span class="keyboard">{{cmd_key}}</span><span class="keyboard">{{meta_key}}</span><span class="keyboard">k</span></li>
			</ul>
			<ul class="no_bullets">
				<li>Bold: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">b</span></li>
				<li>Italic: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">i</span></li>
				<li>Underline: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">u</span></li>
				<li>Code: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">Shift</span><span class="keyboard">k</span></li>
				<li>Strikethrough: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">Shift</span><span class="keyboard">x</span></li>
				<li>Linkify: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">k</span></li>
			</ul>
		</div>
		
		<div class="col">
			<h2>Markdown-style</h2>
			<ul class="no_bullets">
				<li>Heading 1: <span class="keyboard">#</span>+<span class="keyboard">Space</span></li>
				<li>Heading 2: <span class="keyboard">##</span>+<span class="keyboard">Space</span></li>
				<li>Heading 3: <span class="keyboard">###</span>+<span class="keyboard">Space</span></li>
			</ul>			
			<ul class="no_bullets">
				<li>Bulleted list: <span class="keyboard">*</span>+<span class="keyboard">Space</span></li>
				<li>Numbered list: <span class="keyboard">1.</span>+<span class="keyboard">Space</span></li>
				<li>Checklist: <span class="keyboard">[]</span>+<span class="keyboard">Space</span></li>
				<li>Code block: <span class="keyboard">```</span>+<span class="keyboard">Space</span></li>
			</ul>			
			<ul class="no_bullets">
				<li>Bold: <span class="keyboard">*</span>+<span class="keyboard">text</span>+<span class="keyboard">*</span></li>
				<li>Italic: <span class="keyboard">_</span>+<span class="keyboard">text</span>+<span class="keyboard">_</span></li>
				<li>Code: <span class="keyboard">`</span>+<span class="keyboard">text</span>+<span class="keyboard">`</span></li>
				<li>Strikethrough: <span class="keyboard">~</span>+<span class="keyboard">text</span>+<span class="keyboard">~</span></li>
			</ul>
			<ul class="no_bullets">
				<li>Divider: <span class="keyboard">----</span></li>
			</ul>
		</div>
		
		<div class="col last">
			<h2>Miscellaneous</h2>
			<ul class="no_bullets">
				<li>Clear formatting: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">Shift</span><span class="keyboard">0</span></li>
				<li>Indent: <span class="keyboard">Tab</span></li>
				<li>Unindent: <span class="keyboard" aria-label="{{cmd_key_label}}">Shift</span><span class="keyboard">Tab</span></li>
			</ul>
			<ul class="no_bullets">
				<li>Cut: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">x</span></li>
				<li>Copy: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">c</span></li>
				<li>Paste: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">v</span></li>
			</ul>
			<ul class="no_bullets">
				<li>Undo: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">z</span></li>
				<li>Redo: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">Shift</span><span class="keyboard">z</span></li>
			</ul>
			<ul class="no_bullets">			
				<li>Show shortcuts: <span class="keyboard" aria-label="{{cmd_key_label}}">{{cmd_key}}</span><span class="keyboard">/</span></li>
				<li>Dismiss menus: <span class="keyboard">Esc</span></li>
				<li>
			</ul>
		</div>
					
		<div class="clear_both"></div>
	</div>
</script>
	<script id="spaces_style_popover_template" type="text/x-handlebars-template"><div class="textstyle_menu style include_remove new">
	<ul>
		<li><a data-toggle="tooltip" class="bold" data-which="bold" title="Bold"><span></span></a></li>
		<li><a data-toggle="tooltip" class="italic" data-which="italic" title="Italic"><span></span></a></li>
		<li><a data-toggle="tooltip" class="underline" data-which="underline" title="Underline"><span></span></a></li>
		<li><a data-toggle="tooltip" class="strikethrough" data-which="strikethrough" title="Strikethrough"><span></span></a></li>
		<li><a data-toggle="tooltip" class="snippet" data-which="code" title="Code block"><span></span></a></li>
		<li><a data-toggle="tooltip" class="link" data-which="link" title="Link"><span></span></a></li>
		<li><a data-toggle="tooltip" class="deformat" data-which="deformat" title="Clear formatting"><span></span></a></li>
	</ul>
</div>
</script>
	<script id="menu_space_action_items_template" type="text/x-handlebars-template">{{#if actions.share}}
	<li id="keyboard_shortcuts" data-file-id="{{file.id}}" role="menuitem"><a>Keyboard shortcuts</a></li>
{{/if}}

{{#if actions.learn_more}}
	<li id="learn_more" data-file-id="{{file.id}}" role="menuitem"><a>Learn more</a></li>
{{/if}}

<li class="divider"></li>

{{#if can_write_to_clipboard}}
	<li id="copy_space_link" data-file-id="{{file.id}}" role="menuitem"><a>Copy link</a></li>
{{/if}}

{{#if actions.create_public_link}}
	<li id="create_public_space_link" data-file-id="{{file.id}}" role="menuitem"><a>Create public link</a></li>
{{/if}}
{{#if actions.revoke_public_link}}
	<li id="view_public_space_link" data-file-id="{{file.id}}" role="menuitem"><a>View public link</a></li>
{{/if}}

{{#if actions.print}}
	<li id="print_space" data-file-id="{{file.id}}" role="menuitem"><a>Print &hellip;</a></li>
{{/if}}

{{#if actions.delete_file}}
	<li class="divider"></li>
	<li id="delete_space" data-file-id="{{file.id}}" class="danger" role="menuitem"><a>Delete Post{{#if file.is_external}} from Slack{{/if}}</a></li>
{{/if}}</script>


<script id="signup_content_template" type="text/x-handlebars-template">{{#if show_find_team}}
<div class="fs_split_mini_header mini align_center small_padding full_width bottom_border"><span>Looking to join an existing team?</span> <a href="/signin/find" class="underline flat_grey">Find your team.</a></div>
{{/if}}

<div class="fs_split_header" id="slack_logo"></div>


{{#if_equal ratelimit compare=true}}
    <div id="ratelimit_alert" class="header_error_message hidden bottom_margin">
        <h3>Whoa, you're going too fast!</h3>
        Slow down a bit. You might have better luck if you try again in a minute.
    </div>
{{/if_equal}}
{{#if_equal step compare='email'}}
    <div id="lead_create_failed" class="header_error_message hidden bottom_margin">
        <h3>Oh noes! Something went wrong!</h3>
        For some weird reason, that didn't work. Please try again to continue.
    </div>
{{/if_equal}}

{{#if_equal step compare='create_team'}}
    <div id="create_failed_alert" class="header_error_message hidden bottom_margin">
    </div>
{{/if_equal}}

        {{#if_equal step compare='email'}} {{> signup_email_body this}} {{/if_equal}}
        {{#if_equal step compare='email_confirmation'}} {{> signup_email_confirmation_body this}} {{/if_equal}}
        {{#if_equal step compare='team_name'}} {{> signup_team_name_body this}} {{/if_equal}}
        {{#if_equal step compare='domains'}} {{> signup_email_domains_body this}} {{/if_equal}}
        {{#if_equal step compare='url'}} {{> signup_url_body this}} {{/if_equal}}
        {{#if_equal step compare='username'}} {{> signup_username_body this}} {{/if_equal}}
        {{#if_equal step compare='create_team'}} {{> create_team_body this}} {{/if_equal}}
        {{#if_equal step compare='invite'}} {{> signup_invite_body this}} {{/if_equal}}
        {{#if_equal step compare='sso_details'}} {{> sso_signup_details_body this}} {{/if_equal}}

<div id="submit" class="fs_split_footer">

    {{#if_equal step compare='email'}}
        <div id="email_checkbox">
            <input type="checkbox" id="email_misc" data-qa="email_checkbox" {{#if uncheck_email}}{{else}}checked{{/if}}>
            <label for="email_misc">It's ok to send me (very occasional)<br class="hide_on_mobile" /> email about the Slack service.</label>
        </div>
    {{/if_equal}}

    {{#if_equal step compare='email_confirmation'}}
        {{#if show_email_checkbox}}
            <div id="email_checkbox">
                <input type="checkbox" id="email_misc" data-qa="email_checkbox" {{#if uncheck_email}}{{else}}checked{{/if}}>
                <label for="email_misc">It's ok to send me (very occasional)<br class="hide_on_mobile" /> email about the Slack service.</label>
            </div>
        {{/if}}
    {{/if_equal}}

    {{#if_equal step compare='invite'}}
        <div id="email_checkbox">
            <input type="checkbox" id="email_misc" data-qa="email_checkbox" {{#if uncheck_email}}{{else}}checked{{/if}}>
            <label for="email_misc">It's ok to send me (very occasional)<br class="hide_on_mobile" /> email about the Slack service.</label>
        </div>
    {{/if_equal}}

    <button id="submit_btn" type="submit" class="{{#unless email_reminded}}disabled{{/unless}} btn btn_large ladda-button submit_setting" data-style="expand-right" data-qa="submit_button">
        <span class="ladda-label">{{{btn_text}}}</span>
    </button>

    {{#if show_bullets}}
        <p id="bullets">
            <span class="bullet {{#or (if_equal step compare="email") (if_equal step compare="email_confirmation")}} active{{/or}}">•</span>
            <span class="bullet {{#if_equal step compare='team_name'}} active{{/if_equal}}">•</span>
            {{#if show_whitelist}}<span class="bullet {{#if_equal step compare='domains'}} active{{/if_equal}}">•</span>{{/if}}
            <span class="bullet {{#if_equal step compare='url'}} active{{/if_equal}}">•</span>
            <span class="bullet {{#if_equal step compare='username'}} active{{/if_equal}}">•</span>
        </p>
    {{/if}}
</div>


{{#or (if_equal step compare="email") (if_equal step compare="email_confirmation")}}
    <p class="fs_split_well">
        By proceeding to create your account and use Slack, you are agreeing to our <a class="bold" href="/terms-of-service">Terms of Service</a> and <a href="/privacy-policy" class="bold">Privacy Policy</a>. If you do not agree, you cannot use Slack.
    </p>
{{/or}}

</script>
<script id="signup_email_body_template" type="text/x-handlebars-template"><div id="email_form_body" class="fs_split_body">
    <h1>{{title}}</h1>
		<label><span class="normal">Sign up with your </span>e-mail address</label>
		<div class="input_wrapper email">
		    <p id="email_overlay" class="input_overlay"></p>
		    <input type="text" placeholder="you@yourdomain.com" id="signup_email" data-qa="email_field" autocomplete="off" {{#if email_reminded}} value="{{email_reminded}}" {{/if}}/>
		</div>
		<p class="error_message"></p>
		<p class="subtle_silver">(Don't worry about setting a password right now, we'll e-mail you a link to create one)</p>

		{{#if referral}} <h4>Sign up now and get $100.00 in free credit thanks to the team at {{referral}}!</h4> {{/if}}
</div></script>
<script id="signup_email_confirmation_body_template" type="text/x-handlebars-template"><div id="email_confirmation_form_body" class="fs_split_body">
    <h1>{{title}}</h1>
    	<div id="unconfirmed_email_field" class="offscreen">
			<label><span class="normal">Sign up with your </span>e-mail address</label>
			<div class="input_wrapper email">
		        <p class="hidden input_spinner"></p>
		        <p class="hidden input_checkmark"><i class="ts_icon ts_icon_check_small_bold"></i></p>
			    <p id="unconfirmed_email_overlay" class="input_overlay"></p>
			    <input type="text" placeholder="you@yourdomain.com" id="signup_unconfirmed_email" data-qa="unconfirmed_email_field" class="email_field" autocomplete="off" value="{{unconfirmed_email}}"/>
			</div>
    	</div>

    	<div id="email_confirmation_field">
			<label><span class="normal">Enter your email address again.</label>
			<div class="input_wrapper confirmation_email">
		        <p class="hidden input_spinner"></p>
		        <p class="hidden input_checkmark"><i class="ts_icon ts_icon_check_small_bold"></i></p>
			    <p id="email_confirmation_overlay" class="input_overlay"></p>
			    <input type="text" placeholder="you@yourdomain.com" id="signup_email_confirmation" data-qa="email_confirmation_field" autocomplete="off" class="email_field"/>
			</div>
			<p class="error_message"></p>
			<p class="subtle_silver">We want to make extra sure that we can send you your password!</p>
    	</div>
</div></script>
<script id="signup_team_name_body_template" type="text/x-handlebars-template"><div id="team_name_form_body" class="fs_split_body">
    <h1>{{title}}</h1>
    <p class="desc">
        <span class="bold flat_grey">Work at a large company?</span> You might want to name your Slack after your division, or working group.
    </p>
    <label>
        Company or team name <span class="subtle_silver normal">(you can change this later)</span>
    </label>
    <input type="text" placeholder="Ex. Acme or Acme Marketing" id="signup_team_name" maxlength="255" autocomplete="off" data-qa="team_name_field" value="{{#if team_name_prefill}}{{team_name_prefill}}{{/if}}"/>
    <p class="error_message"></p>
</div></script>
<script id="signup_email_domains_body_template" type="text/x-handlebars-template"><div id="email_domains_form_body" class="fs_split_body">
    <h1>{{title}}</h1>
    <p class="desc">You can allow automatic sign up from people with a confirmed email address.</p>
    <label>Company email domain</label>

    <div id="signup_email_domains" class="token_input" data-qa="email_domains_field">
        <i class="ts_icon ts_icon_mentions"></i>
            {{#if email_domains_prefill}}
                {{#each email_domains_prefill}}
                    <span class="token">{{this}}</span>
                {{/each}}
            {{/if}}
        <input type="text" placeholder="yourcompany.com" autocomplete="off">
    </div>

    <p class="error_message"></p>
    <p id="signup_email_domains_inline_wrapper" class="subtle_silver{{#if email_domains_prefill}}{{else}} hidden{{/if}}">
        Anyone with a "<span class="flat_grey">@</span><span id="signup_email_domains_inline" class="flat_grey">
            {{~#if email_domains_prefill~}}
                {{~#each email_domains_prefill~}}
                        {{~this}}{{#if @last}}{{else}}, {{/if~}}
                {{~/each~}}
            {{~/if~}}</span>" email address will be able to sign up to your team.
    </p>
    <p id="signup_no_email_domains_wrapper" class="subtle_silver{{#if email_domains_prefill}} hidden{{/if}}">
        To allow email addresses from multiple domains, separate them with commas.
    </p>
</div>
</script>
<script id="signup_url_body_template" type="text/x-handlebars-template"><div id="url_form_body" class="fs_split_body">
    <h1>{{title}}</h1>
    
    <p class="desc">This is the address that you and your coworkers will use to sign in to Slack.<p>
    <label>Your Slack URL<span class="subtle_silver normal"> (Letters, numbers, and dashes only)</span></label>
    <div class="input_wrapper url">
        <p class="hidden input_spinner"></p>
        <p class="seafoam_green hidden input_checkmark"><i class="ts_icon ts_icon_check_small_bold neutral_white_bg"></i></p>
        <p id="url_overlay"></p>
        <input type="text" id="signup_url" maxlength="21" autocomplete="off" data-qa="url_field" value="{{#if url_prefill}}{{url_prefill}}{{else}}team{{/if}}"/>
    </div>
    <p class="error_message"></p>

    {{#if url_prefill}}
        {{#unless unavailable_urls}}
            <div id="url_available" class="small_top_margin" data-qa="available_url_message">Good news! Your Slack name is <span class="strong seafoam_green">available</span> as a URL. We've pre-filled it for you, but feel free to change it.</div>
        {{/unless}}
    {{/if}}

    {{#if unavailable_urls}}
        <div id="urls_unavailable" class="small_top_margin" data-qa="unavailable_urls_message">
            {{#if_gt unavailable_urls.length compare=1}}
                <span class="italic"> We tried the following URLs, but they were unavailable:</span>
            {{else}}
                <span class="italic">We tried the following URL, but it was unavailable:</span>
            {{/if_gt}}

            {{#foreach unavailable_urls}}
                <p class="bold no_margin">{{this.value}}.slack.com</p>
            {{/foreach}}
        </div>
    {{/if}}
</div></script>
<script id="signup_username_body_template" type="text/x-handlebars-template"><div id="username_form_body" class="fs_split_body">
    <h1>{{title}}</h1>
    <p class="desc">
        Your username should be something that your coworkers would recognize.
    </p>
    <label>Username</label>
	<div class="input_wrapper username">
	    <p id="username_overlay" class="input_overlay"></p>
    	<input type="text" id="signup_username" maxlength="21" autocomplete="off" data-qa="username_field" value="{{#if username_prefill}}{{username_prefill}}{{/if}}"/>
	</div>

    <p class="error_message"></p>

    <p class="subtle_silver">Usernames must be all lowercase. They can only contain letters, numbers, periods, hyphens, and underscores.</p>
</div></script>
<script id="create_team_body_template" type="text/x-handlebars-template">
<div id="create_team_body" class="fs_split_body">
    <h1>{{title}}</h1>
    <div id="email_form_body" class="create_team_section disabled">
        <label>Email</label>
        <div class="ct_input_wrapper input_wrapper email">
            <p id="email_overlay" class="input_overlay"></p>
            <input type="text" autocomplete="off" disabled="true" id="signup_email" data-qa="email_field" value="{{email}}">
            <a class="edit_btn" data-toggle="tooltip" data-original-title="This is the e-mail address linked to your Slack account.">Edit</a>
        </div>
        <p class="error_message">Invalid email address!</p>
    </div>

    <div id="team_name_form_body" class="create_team_section disabled">
        <label>Slack name</label>
        <div class="ct_input_wrapper">
            <input type="text" autocomplete="off" id="signup_team_name" disabled="true" maxlength="255" data-qa="team_name_field" value="{{team_name}}">
            <a class="edit_btn" data-toggle="tooltip" data-original-title="This is the name of your Slack team.">Edit</a>
        </div>
        <p class="error_message"></p>
    </div>

    {{#if show_whitelist}}
        <div id="email_domains_form_body" class="create_team_section disabled">
            <label>Slack email domains</label>
            <div class="ct_input_wrapper">
                <div id="signup_email_domains" class="token_input" data-qa="email_domains_field">
                    <i class="ts_icon ts_icon_mentions"></i>
                    <input type="text" disabled="true" autocomplete="off" value="{{email_domains_value}}">
                    <a class="edit_btn" data-toggle="tooltip" data-original-title={{#if_equal email_domains_count compare=1}}"People with an e-mail address on this domain can sign up to your Slack team."{{else}}"People with e-mail addresses on these domains can sign up to your Slack team."{{/if_equal}}>Edit</a>
                </div>
            </div>
            <p class="error_message"></p>
        </div>
    {{/if}}

    <div id="url_form_body" class="create_team_section disabled">
        <label>Slack URL</label>
        <div class="ct_input_wrapper input_wrapper url_create">
            <p id="url_spinner" class="hidden"></p>
            <p id="url_checkmark" class="seafoam_green hidden"><i class="ts_icon ts_icon_check_small_bold neutral_white_bg"></i></p>
            <p id="url_overlay"></p>
            <input type="text" maxlength="21" autocomplete="off" id="signup_url" class="" disabled="true" data-qa="url_field" value="{{url}}">
            <a class="edit_btn" data-toggle="tooltip" data-original-title="This is the URL of your Slack account.">Edit</a>
        </div>
        <p class="error_message"></p>
    </div>

    <div id="username_form_body" class="create_team_section disabled">
        <label>Username</label>
        <div class="ct_input_wrapper input_wrapper username">
            <p id="username_overlay" class="input_overlay"></p>
            <input type="text" maxlength="21" autocomplete="off" id="signup_username" disabled="true" data-qa="username_field" value="{{username}}">
            <a class="edit_btn" data-toggle="tooltip" data-original-title="This is how you will appear to others in Slack.">Edit</a>
        </div>
        <p class="error_message"></p>
    </div>
</div></script>
<script id="signup_invite_body_template" type="text/x-handlebars-template"><div id="invite_form_body" class="fs_split_body">
    <h1>{{title}}</h1>
    {{#or sso_required sso_suggested}}
        <div id="sso_container">
            {{#if_equal auth_mode compare="google"}}
                {{#if sso_required}}
                    <p>This team requires you to sign up with your <strong>@{{email_domain}}</strong> Google account.</p>
                {{else}}
                    {{#if domain_match}}
                        <p>
                            {{#if_gt allowed_domains_count compare=1}}
                                This team allows you to sign up with your <strong>Google Apps</strong> account.
                            {{else}}
                                This team allows you to sign up with your <strong>@{{google_sso_domain}}</strong> Google account.
                            {{/if_gt}}
                        </p>
                    {{/if}}
                {{/if}}
                {{#or sso_required domain_match}}
                    <p>
                        <a href="{{auth_url}}" class="btn btn_info btn_large btn_with_icon full_width">
                            <i class="ts_icon ts_icon_google"></i>
                            Sign up with Google
                        </a>
                    </p>
                {{/or}}
                {{#if sso_required}}{{else}}
                    {{#if domain_match}}
                        <p class="large_top_margin">You can also register with a <strong>username</strong> and <strong>password</strong>.</p>
                        <p id="no_sso_btn" class="btn btn_large full_width ladda-button">
                            <span class="ladda-label">Enter username and password</span>
                        </p>
                    {{/if}}
                {{/if}}
            {{else}}
                <p>
                    {{#if sso_required}}This team requires you to sign in with your{{else}}This team allows you to sign in with your{{/if}} {{saml_provider}} account.
                </p>
                <p>
                    <a href="/sso/saml/start?action=invite&redir=%2Finvite%2F{{invite_code}}" class="btn btn_info btn_large btn_with_icon full_width">
                        <i class="ts_icon ts_icon_key"></i>
                        Sign in with {{saml_provider}}
                    </a>
                </p>
                {{#unless sso_required}}
                    <p class="large_top_margin">You can also register with a <strong>username</strong> and <strong>password</strong>.</p>
                    <p id="no_sso_btn" class="btn btn_large full_width ladda-button">
                        <span class="ladda-label">Enter username and password</span>
                    </p>
                {{/unless}}
            {{/if_equal}}
        </div>
    {{/or}}
    {{#unless sso_required}}
        <div id="username_container">
            <label for="signup_username">Username</label>
            <div class="input_wrapper username">
                <p id="username_overlay" class="input_overlay"></p>
                <input type="text" id="signup_username" maxlength="21" autocomplete="off" data-qa="username_field" placeholder="Username" value="{{#if username_prefill}}{{username_prefill}}{{/if}}"/>
            </div>
            <p class="error_message" id="username_error_message"></p>

            <p class="subtle_silver">Usernames must be all lowercase. They cannot be longer than 21 characters and can only contain letters, numbers, periods, hyphens and underscores.</p>

            {{#if custom_username_policy}}
                <div id="custom_username_policy" class="large_bottom_margin">
                    <p class="bold small_bottom_margin">Custom rules for this team:</p>
                    <p class="no_bottom_margin">{{custom_username_policy}}</p>
                </div>
            {{/if}}
        </div>
        <div id="password_container">
            <label for="password">Password</label>
            <input type="password" id="signup_password" data-qa="password-field" placeholder="Password" name="password" value="{{#if password_prefill}}{{password_prefill}}{{/if}}" />
            <p class="error_message" id="password_error_message"></p>

            <p class="subtle_silver">Passwords must be at least 6 characters long, and can't be things like <i>password</i>, <i>123456</i> or <i>abcdef</i>.</p>
        </div>
    {{/unless}}
</div>
</script>
<script id="sso_signup_details_body_template" type="text/x-handlebars-template"><div id="create_team_body" class="fs_split_body">
    <h1>{{title}}</h1>
    <div id="email_form_body" class="create_team_section disabled">
        <label>Email</label>
        <div class="ct_input_wrapper input_wrapper email">
            <p id="email_overlay" class="input_overlay"></p>
            <input type="text" autocapitalize="off" autocorrect="off" disabled="true" id="signup_email" data-qa="email_field" value="{{email}}" name="email">
            <a class="edit_btn" data-toggle="tooltip" data-original-title="This is the e-mail address linked to your Slack account.">Edit</a>
        </div>
        <p class="error_message" id="email_error_message">Invalid email address!</p>
    </div>

    <div id="username_form_body" class="create_team_section disabled">
        <label>Username</label>
        <div class="ct_input_wrapper input_wrapper username">
            <p id="username_overlay" class="input_overlay"></p>
            <input type="text" maxlength="21" autocomplete="off" autocapitalize="off" autocorrect="off" id="signup_username" disabled="true" data-qa="username-field" value="{{username}}" name="username">
            <a class="edit_btn" data-toggle="tooltip" data-original-title="This is how you will appear to others in Slack.">Edit</a>
        </div>
        <p class="error_message" id="username_error_message"></p>
    </div>
    <input type="hidden" name="crumb" value="{{crumb}}">
    <input type="hidden" name="signup" value="1">
    <input type="hidden" name="tz" id="tz">
</div></script>
<script id="signin_find_team_template" type="text/x-handlebars-template"><div class="fs_split_header" id="slack_logo"></div>

<div class="header_error_message hidden"></div>

<div id="form_body" class="fs_split_body">
	<h1>Find your team</h1>
	<label><span class="normal">Enter your </span>e-mail address</label>
	<div class="input_wrapper email">
		<p id="email_overlay"></p>
		<input type="text" placeholder="you@yourdomain.com" id="email_input" autocomplete="off"/>
	</div>
	<p class="error_message"></p>
	<div class="desc">An email will be sent to this address with links to any team that you belong to.</div>
</div>

<div id="submit_footer" class="fs_split_footer centered">
	<button id="submit_btn" type="submit" class="disabled btn btn_large ladda-button submit_setting" data-style="expand-right">
		<span class="ladda-label">Send me a sign in email</span>
	</button>
	{{#if started_signup}}
		<p class="normal_margin subtle_silver"><i class="ts_icon ts_icon_arrow_left"></i>Or, <a href="/create" class="clear_blue"> go back to making a new team</a></p>
	{{/if}}
</div>
<div class="fs_split_footer"></div></script>
<script id="signin_find_team_email_sent_template" type="text/x-handlebars-template"><div class="fs_split_header" id="slack_logo"></div>

<div id="sent_invite_body" class="fs_split_body">
    <h1>Reminder sent!</h1>
        <p class="desc small_bottom_margin">We've sent an email to</p>
        <h4 class="flat_grey bold">{{email}}.</h4>
        <p class="desc small_bottom_margin">It contains links to any teams that you belong to. Check it for details about signing in.</p>
</div>

<div class="fs_split_footer"></div>
<div class="fs_split_footer subtle_silver">
{{#isOurApp}}
	(Once you've received it, <a href="/signin" class="bold">click here to sign in</a>.)
{{else}}
	(You can probably close this page now.)
{{/isOurApp}}
</div></script>
<script id="invite_form_template" type="text/x-handlebars-template"><div class="fs_split_header" id="slack_logo"></div>

<div id="ratelimit_alert" class="header_error_message hidden bottom_margin">
    <h3>Whoa, you're going too fast!</h3>
    Slow down a bit. You might have better luck if you try again in a minute.
</div>

<div id="invite_form_body" class="fs_split_body">
    <h1>{{title}}</h1>

    <div id="username_container">
        <label for="invite_username">Username</label>
        <div class="input_wrapper username">
            <p id="username_overlay" class="input_overlay"></p>
            <input type="text" id="invite_username" maxlength="21" autocomplete="off" data-qa="username_field" placeholder="Username" value="{{#if username_prefill}}{{username_prefill}}{{/if}}"/>
        </div>
        <p class="error_message" id="username_error_message"></p>

        <p class="subtle_silver">Usernames must be all lowercase. They cannot be longer than 21 characters and can only contain letters, numbers, periods, hyphens and underscores.</p>

        {{#if custom_username_policy}}
            <div id="custom_username_policy" class="large_bottom_margin">
                <p class="bold small_bottom_margin">Custom rules for this team:</p>
                <p class="no_bottom_margin">{{custom_username_policy}}</p>
            </div>
        {{/if}}
    </div>

    <div id="password_container">
        <label for="password">Password</label>
        <input type="password" id="invite_password" data-qa="password-field" placeholder="Password" name="password" value="{{#if password_prefill}}{{password_prefill}}{{/if}}" />
        <p class="error_message" id="password_error_message"></p>

        <p class="subtle_silver">Passwords must be at least 6 characters long, and can't be things like <i>password</i>, <i>123456</i> or <i>abcdef</i>.</p>
    </div>
</div>

<div id="submit" class="fs_split_footer">

    <div id="email_checkbox">
        <input type="checkbox" id="email_misc" data-qa="email_checkbox" {{#if uncheck_email}}{{else}}checked{{/if}}>
        <label for="email_misc">It's ok to send me (very occasional)<br class="hide_on_mobile" /> email about the Slack service.</label>
    </div>


    <button id="submit_btn" type="submit" class="{{#unless email_reminded}}disabled{{/unless}} btn btn_large ladda-button submit_setting" data-style="expand-right" data-qa="submit_button">
        <span class="ladda-label">Next<i class="ts_icon ts_icon_arrow_right"></i></span>
    </button>
</div>

<p class="fs_split_well">
    By proceeding to create your account and use Slack, you are agreeing to our <a class="bold" href="/terms-of-service">Terms of Service</a> and <a href="/privacy-policy" class="bold">Privacy Policy</a>. If you do not agree, you cannot use Slack.
</p>
</script>
<script id="invite_sso_form_template" type="text/x-handlebars-template"><div class="fs_split_header" id="slack_logo"></div>

<div id="invite_sso_form_body" class="fs_split_body">
    <h1>{{title}}</h1>
    <div id="sso_container">
        {{#if_equal auth_mode compare="google"}}
            {{#if sso_required}}
                <p>This team requires you to sign up with your <strong>@{{email_domain}}</strong> Google account.</p>
            {{else}}
                {{#if domain_match}}
                    <p>
                        {{#if_gt allowed_domains_count compare=1}}
                            This team allows you to sign up with your <strong>Google Apps</strong> account.
                        {{else}}
                            This team allows you to sign up with your <strong>@{{google_sso_domain}}</strong> Google account.
                        {{/if_gt}}
                    </p>
                {{/if}}
            {{/if}}
            {{#or sso_required domain_match}}
                <p>
                    <a href="{{auth_url}}" class="btn btn_info btn_large btn_with_icon full_width">
                        <i class="ts_icon ts_icon_google"></i>
                        Sign up with Google
                    </a>
                </p>
            {{/or}}
            {{#if sso_required}}{{else}}
                {{#if domain_match}}
                    <p class="large_top_margin">You can also register with a <strong>username</strong> and <strong>password</strong>.</p>
                    <p id="no_sso_btn" class="btn btn_large full_width ladda-button">
                        <span class="ladda-label">Enter username and password</span>
                    </p>
                {{/if}}
            {{/if}}
        {{else}}
            <p>
                {{#if sso_required}}This team requires you to sign in with your{{else}}This team allows you to sign in with your{{/if}} {{saml_provider}} account.
            </p>
            <p>
                <a href="/sso/saml/start?action=invite&redir=%2Finvite%2F{{invite_code}}" class="btn btn_info btn_large btn_with_icon full_width">
                    <i class="ts_icon ts_icon_key"></i>
                    Sign in with {{saml_provider}}
                </a>
            </p>
            {{#unless sso_required}}
                <p class="large_top_margin">You can also register with a <strong>username</strong> and <strong>password</strong>.</p>
                <p id="no_sso_btn" class="btn btn_large full_width ladda-button">
                    <span class="ladda-label">Enter username and password</span>
                </p>
            {{/unless}}
        {{/if_equal}}
    </div>
</div>

<div class="fs_split_footer"></div>
<div class="fs_split_footer"></div></script>

<script id="channel_page_empty_state_template" type="text/x-handlebars-template">	<div id="channel_page_scroller" class="flex_content_scroller">

		<div class="selectable_flex_pane_padder no_top_margin">

			<div class="conversation_details"></div>

			<div class="channel_page_about channel_page_section {{#if state.expanded_sections.about}}expanded{{/if}}" data-section-name="about">

				<div class="section_header no_bottom_margin display_flex align_items_center">
					<i class="ts_icon {{#feature flag="feature_channel_details"}} ts_icon_info{{else}}ts_icon_info_circle{{/feature}} channel_page_blue small_right_margin"></i>
					<a id="channel_page_title" title="Click to expand or collapse" class="flex_one"></a>

					<div class="disclosure_triangle inline_block left_margin">
						<i class="ts_icon ts_icon_caret_right"></i>
						<i class="ts_icon ts_icon_caret_down"></i>
					</div>
				</div>

				<div class="section_content channel_purpose"></div>

			</div>

			<div class="channel_page_pinned_items channel_page_section {{#if state.expanded_sections.pinned_items}}expanded{{/if}}" data-section-name="pinned_items">

				<div class="section_header no_bottom_margin display_flex align_items_center">
					<i class="ts_icon ts_icon_thumb_tack pin_orange small_right_margin" ></i>
					<a title="Click to expand or collapse" class="flex_one" id="pinned_items_title"></a>

					<div class="disclosure_triangle inline_block left_margin">
						<i class="ts_icon ts_icon_caret_right"></i>
						<i class="ts_icon ts_icon_caret_down"></i>
					</div>
				</div>

				<div class="section_content pinned_items"></div>

			</div>

			<div class="channel_page_members channel_page_section {{#if state.expanded_sections.members}}expanded{{/if}}" data-section-name="members">
				<div class="channel_page_member_tabs section_header"></div>
				<div class="channel_page_member_lists section_content"></div>
			</div>

			{{#feature flag="feature_channel_details"}}
				<div class="channel_page_shared_files channel_page_section {{#if state.expanded_sections.shared_files}}expanded{{/if}}" data-section-name="shared_files">

				<div class="section_header no_bottom_margin display_flex align_items_center">
					<i class="ts_icon ts_icon_all_files mustard_yellow small_right_margin"></i>
					<a title="Click to expand or collapse" class="flex_one" id="channel_files_title">Shared Files</a>

					<div class="disclosure_triangle inline-block left_margin">
						<i class="ts_icon ts_icon_caret_right"></i>
						<i class="ts_icon ts_icon_caret_down"></i>
					</div>
				</div>

				<div class="section_content bottom_margin"></div>

				</div>
			{{/feature}}

			{{#feature flag="feature_channel_details"}}
				<div class="channel_page_notif_prefs channel_page_section {{#if state.expanded_sections.notif_prefs}}expanded{{/if}}" data-section-name="notif_prefs">

					<div class="section_header no_bottom_margin display_flex align_items_center">
						<span class="channel_page_notif_prefs_mute_state">
							<i class="ts_icon ts_icon_bell_o moscow_red small_right_margin"></i>
						</span>
						<a id="channel_notif_prefs_title" title="Click to expand or collapse" class="flex_one">Notification Preferences</a>

						<div class="disclosure_triangle inline_block left_margin">
							<i class="ts_icon ts_icon_caret_right"></i>
							<i class="ts_icon ts_icon_caret_down"></i>
						</div>
					</div>

					<div class="section_content"></div>
				</div>
			{{/feature}}

		</div>

	</div>

</script>
<script id="channel_page_details_template" type="text/x-handlebars-template">{{#feature flag="feature_channel_details"}}
	<div class="channel_purpose_section">
		<div class="bold subtle_silver purpose_label mini">Purpose</div>
		<div class="bold subtle_silver edit_purpose_label hidden mini tiny_bottom_margin">Set a new purpose</div>

		<div class="channel_purpose_text">
			{{#if model_ob.purpose.value}}
				{{{formatTopicOrPurpose model_ob.purpose.value}}}
				{{#if show_edit_purpose_or_topic}}<a class="edit_purpose mini">edit</a>{{/if}}
			{{else}}
				{{#if show_edit_purpose_or_topic}}
					<a class="edit_purpose mini block">Set a {{#feature flag="feature_private_channels"}}channel{{else}}{{#if model_ob.is_channel}}channel{{else}}group{{/if}}{{/feature}} purpose</a>
				{{else}}
					<span class="italic">A purpose has not been set for {{#feature flag="feature_private_channels"}}{{#unless model_ob.is_channel}}<i class="ts_icon ts_icon_lock"></i> {{/unless}}{{/feature}}{{#if model_ob.is_channel}}#{{/if}}{{model_ob.name}}.</span>
				{{/if}}
			{{/if}}
		</div>

		<textarea type="text" id="channel_purpose_input" class="hidden small" maxLength="{{ChannelPurposeMaxLength}}" tabindex="1">{{#if model_ob.purpose.value}}{{unFormatMessage model_ob.purpose.value}}{{else}}{{/if}}</textarea>

		<button class="hidden btn btn_outline btn_small purpose_cancel tiny_right_margin" tabindex="3">Cancel</button>
		<button class="hidden btn btn_small purpose_done" tabindex="2">Done</button>
	</div>

	<div class="channel_topic_section">
		<div class="bold subtle_silver topic_label mini top_margin">Current topic</div>
		<div class="bold subtle_silver edit_topic_label hidden mini top_margin tiny_bottom_margin">Set topic:</div>

		<div class="channel_topic">
			{{#if model_ob.topic.value}}
				{{{formatTopicOrPurpose model_ob.topic.value}}}
				{{#if show_edit_purpose_or_topic}}<a class="edit_topic mini">edit</a>{{/if}}
			{{else}}
				{{#if show_edit_purpose_or_topic}}
					<a class="edit_topic mini block">Set a {{#feature flag="feature_private_channels"}}channel{{else}}{{#if model_ob.is_channel}}channel{{else}}group{{/if}}{{/feature}} topic</a>
				{{else}}
					<span class="italic">A topic has not been set for {{#feature flag="feature_private_channels"}}{{#unless model_ob.is_channel}}<i class="ts_icon ts_icon_lock"></i> {{/unless}}{{/feature}}{{#if model_ob.is_channel}}#{{/if}}{{model_ob.name}}.</span>
				{{/if}}
			{{/if}}
		</div>

		<textarea type="text" id="channel_topic_input" class="hidden small" maxLength="{{ChannelTopicMaxLength}}" tabindex="1">{{#if model_ob.topic.value}}{{unFormatMessage model_ob.topic.value}}{{else}}{{/if}}</textarea>

		<button class="hidden btn btn_outline btn_small topic_cancel tiny_right_margin" tabindex="3">Cancel</button>
		<button class="hidden btn btn_small topic_done" tabindex="2">Done</button>
	</div>

	<div class="creator italic subtle_silver top_margin">Created by {{creator_name}} {{creation_date}}</div>
{{else}}
	{{#if model_ob.purpose.value}}
		<p class="channel_purpose">{{{formatTopicOrPurpose model_ob.purpose.value}}}</p>
	{{else}}
		{{#if show_set_purpose}}
		<p class="italic subtle_silver channel_purpose">
			A purpose has not been set for {{#if model_ob.is_channel}}#{{/if}}{{model_ob.name}}.
			Why not let everyone know <a class="set_purpose">what this {{#if model_ob.is_channel}}channel{{else}}{{groupCopy}}{{/if}} is for</a>?
		</p>
		{{/if}}
	{{/if}}

	<p class="created_by">Created by {{creator_name}} {{creation_date}}.</p>

	{{#if show_invite}}
	<p class="channel_page_action">
		<a class="invite_link"><i class="ts_icon ts_icon_add_user"></i>Invite more people to this {{#if model_ob.is_channel}}channel{{else}}{{groupCopy skip_private=true}}{{/if}}</a>
	</p>
	{{/if}}
	<p class="channel_page_action">
		<a class="find_files_link"><i class="ts_icon ts_icon_search_files"></i>Find files shared in this {{#if model_ob.is_channel}}channel{{else}}{{groupCopy skip_private=true}}{{/if}}</a>
	</p>
	{{#if show_leave}}
	<p class="channel_page_action">
		<a class="leave_link"><i class="ts_icon ts_icon_sign_out"></i>Leave {{#if model_ob.is_channel}}#{{/if}}{{model_ob.name}}</a>
	</p>
	{{/if}}
{{/feature}}</script>
<script id="channel_page_member_tabs_template" type="text/x-handlebars-template">	<i class="ts_icon ts_icon_user icon_member_header small_right_margin"></i>
	<a id="member_count_title" title="Click to expand or collapse" class="flex_one">{{online_count}}<span class="dull_grey">/{{member_count}}</span> {{pluralize member_count 'Member' 'Members'}}</a>

	{{#if show_restricted_members}}
		<div class="restricted_members_count ts_tip ts_tip_top ts_tip_float ts_tip_multiline ts_tip_delay_300" title="{{restricted_count}} Restricted {{pluralize restricted_count 'Account' 'Accounts'}}">
			<i class="ts_icon ts_icon_lock_o icon_restricted_header"></i> {{restricted_count}}
		</div>
	{{/if}}

	<div class="disclosure_triangle inline_block">
		<i class="ts_icon ts_icon_caret_right"></i>
		<i class="ts_icon ts_icon_caret_down"></i>
	</div>

</script>
<script id="channel_page_member_lists_template" type="text/x-handlebars-template"><div id="channel_page_all_members">
	{{#each members}}
		{{> channel_page_member_row member=this lazy=true}}
	{{/each}}
</div>

{{#if model_ob.is_mpim}}
	{{#canUserCreateMpims}}
		<a class="add_someone small_top_margin block">Add someone &hellip;</a>
	{{/canUserCreateMpims}}
{{/if}}</script>
<script id="channel_page_member_row_template" type="text/x-handlebars-template">{{#feature flag="feature_channel_page_perf"}}{{else}}
	<div id="channel_page_member_{{member.id}}" class="channel_page_member_row overflow_ellipsis {{member.presence}}">
{{/feature}}
		{{{makeMemberPreviewLinkImage member.id 20 lazy false}}}
		{{{makeMemberPresenceIcon member}}} <a href="/team/{{member.name}}" data-member-id="{{member.id}}">{{getMemberDisplayName member}}</a>
{{#feature flag="feature_channel_page_perf"}}{{else}}
	</div>
{{/feature}}
</script>
<script id="channel_page_empty_pinned_items_template" type="text/x-handlebars-template"><p class="italic subtle_silver empty_pinned_items">
	No items have been pinned yet! Click the{{#feature flag="feature_new_message_markup"}}<span class="no_wrap"><i class="ts_icon align_bottom ts_icon_chevron_down"></i>{{else}} <span class="no_wrap"><i class="ts_icon align_bottom ts_icon_cog"></i> {{/feature}}icon</span> on important messages or files and choose
	<span class="indifferent_grey ">Pin to {{pinToLabel model_ob}}</span> to stick them here.
</p></script>
<script id="channel_page_pinned_item_template" type="text/x-handlebars-template">	<div class="pinned_item" data-type="{{item.type}}" data-ts="{{item.message.ts}}" data-file-id="{{item.file.id}}" data-comment-id="{{item.comment.id}}">

		{{#if can_remove}}<a class="remove_pin ts_icon ts_icon_times_small" title="Click to un-pin this item"></a>{{/if}}

		{{#if is_message}}
			<p class="no_bottom_margin">
				{{#if member}}
					<span class="pin_member_name tiny_right_margin">{{{makeMemberPreviewLinkById item.message.user}}}</span>
				{{else}}
					<span class="pin_member_name tiny_right_margin">{{{getBotNameWithLink item.message}}}</span>
					{{#if is_bot}}<span class="bot_label">BOT</span>{{/if}}
				{{/if}}
				<a href="{{permalink}}" class="pin_metadata" target="{{newWindowName}}">{{toCalendarDateOrNamedDayShort item.message.ts}}{{#isToday item.message.ts}} at {{toTime item.message.ts}}{{/isToday}}</a>
			</p>
			<div class="tiny_top_margin pinned_message_text">
				{{{formatMessageByType item.message true false model_ob}}}
				{{{formatAttachments item.message}}}
				<span class="pin_truncate_fade"></span>
			</div>
		{{/if}}

		{{#if is_file}}
			<p class="no_wrap overflow_ellipsis no_bottom_margin pin_file_title">{{{formatFileTitle item.file}}}</p>
			<p class="no_wrap overflow_ellipsis no_bottom_margin pin_metadata tiny_top_margin">
				{{#if item.file.is_external}}
					{{{makeExternalFiletypeHTML item.file}}}
				{{else}}
					{{#if_equal item.file.filetype compare="space"}}
						Post
					{{else}}
						{{item.file.pretty_type}}
					{{/if_equal}}
				{{/if}}
			</p>
		{{/if}}

		{{#if is_comment}}
			<p class="no_bottom_margin"><span class="pin_member_name tiny_right_margin">{{{makeMemberPreviewLinkById item.comment.user}}}</span> <span class="pin_metadata">{{toCalendarDateOrNamedDayShort item.comment.timestamp}}{{#isToday item.comment.timestamp}} at {{toTime item.comment.timestamp}}{{/isToday}}</span></p>
			<p class="no_bottom_margin tiny_top_margin pinned_message_text">{{{formatMessage item.comment.comment}}}<span class="pin_truncate_fade"></span></p>
		{{/if}}

	</div>

</script>

	<script id="channel_page_conversation_details_template" type="text/x-handlebars-template">{{#feature flag="feature_channel_details"}}
	<div class="member_info display_flex">
		{{{makeMemberPreviewLinkImage member.id 72 false true}}}
		<div class="display_flex flex_direction_column justify_content_center no_min_width">
			{{#if member.profile.real_name}}
				<div class="member_name bold link cursor_pointer" onclick="TS.client.ui.previewMember('{{member.id}}', 'im_page');">
					{{#if member.is_slackbot}}Slackbot{{else}}{{member.profile.real_name}}{{/if}}
				</div>
				<div class="block overflow_ellipsis cloud_silver">
					<span class="member_username mini">@{{member.name}}</span>
					{{{makeMemberPresenceIcon member}}}
					<span class="member_local_time mini cloud_silver">{{member_local_time}} local time</span>
				</div>
			{{else}}
				<div>
					<span class="member_name bold link cursor_pointer" onclick="TS.client.ui.previewMember('{{member.id}}', 'im_page');">
						{{member.name}}
					</span>
					{{{makeMemberPresenceIcon member}}}
				</div>
				<div class="member_local_time mini cloud_silver">{{member_local_time}} local time</div>
			{{/if}}
			<div class="member_title mini">
				{{#if member.is_slackbot}}Friendly bot, private note-keeper, part-time programmer, full-time assistant.{{else}}{{member.profile.title}}{{/if}}
			</div>
		</div>
		<div class="clearfix"></div>
	</div>
{{/feature}}</script>
	<script id="channel_page_empty_shared_files_template" type="text/x-handlebars-template"><p class="italic subtle_silver empty_shared_files">
	There are no files to see here right now! But there could be – drag and drop any file into the message pane to add it to this conversation.
</p></script>
	<script id="channel_page_view_all_files_link_template" type="text/x-handlebars-template">{{#feature flag="feature_channel_details"}}
	<a class="view_all_files_link sky_blue overflow_ellipsis">
		<i class="ts_icon ts_icon_search_files"></i>
		View all files {{#if model_ob.is_im}}shared with {{#if member.profile.first_name}}{{member.profile.first_name}}{{else}}{{member.name}}{{/if}}{{/if}}{{#feature flag="feature_private_channels"}}{{#if model_ob.is_group}}in <i class="ts_icon ts_icon_lock"></i> {{model_ob.name}}{{/if}}{{/feature}}{{#if model_ob.is_channel}}in #{{model_ob.name}}{{/if}}
	</a>
{{/feature}}</script>
	<script id="channel_page_notif_prefs_template" type="text/x-handlebars-template">{{#feature flag="feature_channel_details"}}
{{#unless is_muted}}
	<div class="channel_desktop_notifs small_bottom_margin">
		<div class="bold subtle_silver mini">Desktop notifications</div>
		{{#if desktop_notifs_enabled}}
			{{#if desktop_everything}}Activity of any kind{{/if}}
			{{#if desktop_mentions}}Highlight words &amp; @mentions{{/if}}
			{{#if desktop_nothing}}Nothing please{{/if}}
		{{else}}
			<p class="highlight_yellow_bg">
				{{#if notifications_not_yet_allowed}}
					<span>You have not yet allowed desktop notifications. Open the <a onclick="TS.ui.prefs_dialog.start('notifications')" class="cursor_pointer bold">Preferences Dialog</a> and follow the instructions to set them up.</span>
				{{/if}}
				{{#if notifications_not_allowed}}
					<span>You've disallowed notifications in your browser. You'll need to open your browser preferences to change that.</span>
				{{/if}}
				{{#if notifications_impossible}}
					<span>Your browser does not support desktop notifications. <a href="/apps" target="_blank">Try one of our apps?</a></span>
				{{/if}}
			</p>
		{{/if}}
	</div>
	<div class="channel_push_notifs bottom_margin">
		<div class="bold subtle_silver mini">Mobile push notifications</div>
			{{#if push_everything}}Activity of any kind{{/if}}
			{{#if push_mentions}}Highlight words &amp; @mentions{{/if}}
			{{#if push_nothing}}Nothing please{{/if}}
	</div>
{{/unless}}
{{#if is_muted}}
	<div class="bold bottom_margin">
		This {{> channel_conversation_or_group}} is muted
	</div>
{{/if}}
<button class="edit_notif_prefs_btn btn btn_small btn_outline">Edit notification preferences</button>
{{/feature}}</script>
	<script id="channel_page_channel_conversation_or_group_template" type="text/x-handlebars-template">{{#if model_ob.is_channel}}
	channel
{{else}}
	{{#feature flag="feature_private_channels"}}
		{{#if model_ob.is_mpim}}
			conversation
		{{else}}
			channel
		{{/if}}
	{{else}}
		{{#if model_ob.is_mpim}}
			conversation
		{{else}}
			group
		{{/if}}
	{{/feature}}
{{/if}}</script>
	<script id="channel_page_notif_prefs_mute_state_template" type="text/x-handlebars-template"><i class="ts_icon {{#if is_muted}}ts_icon_bell_slash{{else}}ts_icon_bell_o{{/if}} moscow_red small_right_margin"></i></script>

<script id="bot_icon_modal_template" type="text/x-handlebars-template"><h1>Upload an icon</h1>
<div class="alert bottom_margin hidden" id="icon_upload_alert"><i class="ts_icon ts_icon_warning"></i><span class="alert_body"></span></div>
<div id="bot_icon_modal" data-current-step="upload">
	<div class="step" data-progress="prompt" data-step="upload" id="upload_step">
		<div class="drop_zone">
			<span class="upload_prompt">Drop an image file here, or click to upload.</span>
			<div class="upload_progress">
				<div id="upload_progress_circle"></div>
				<span>Uploading...</span>
			</div>
		</div>
		<form>
			<input type="file" id="hidden_file" name="image">
		</form>
	</div>
	<div class="step" data-step="crop">
		<img id="crop_img">
		<div class="actions">
			<button class="btn ladda-button disabled" data-style="expand-right" id="crop_btn" disabled="disabled"><span class="ladda-label">Crop</span></button>
		</div>
	</div>
</div>
</script>
<script id="bot_icon_preview_template" type="text/x-handlebars-template">{{#if emoji}}
	<span class="{{classes}} transparent">{{{emoji}}}</span>
{{else}}
	<img src="{{image}}" class="{{classes}}" />
{{/if}}
</script>

	<script id="filter_select_container_template" type="text/x-handlebars-template"><div class="fsl_input_container empty">
	{{#if instance.single}}<div class="fsl_value"></div>{{/if}}
	<input type="text" class="fsl_input" size="1" placeholder="{{ instance.placeholder_text }}">
</div>
<div class="fsl_list_container">
	<div class="fsl_scroller">
		<div class="fsl_list"></div>
	</div>
</div>
</script>
	<script id="filter_select_pagination_template" type="text/x-handlebars-template"><div class="fsl_paginate" data-pages="{{ num_pages }}">
	<span class="fsl_paginate_back"><i class="ts_icon ts_icon_arrow_left_medium"></i></span>
	<span>Page {{ page }} of {{ num_pages }}</span>
	<span class="fsl_paginate_forward"><i class="ts_icon ts_icon_arrow_right_medium"></i></span>
</div>
</script>
	<script id="filter_select_item_template" type="text/x-handlebars-template"><div class="fsl_item {{#if active}} active{{/if}}{{#if selected}} selected{{/if}}{{#if disabled}} disabled{{/if}}{{#if token}} fsl_token{{/if}}{{#if single}} single{{/if}}{{#if in_group}} group_item{{/if}}{{#if item_class}} {{ item_class }}{{/if}}" data-index="{{ index }}">
	{{ content }}
</div>
</script>
	<script id="invite_member_small_template" type="text/x-handlebars-template"><div class="invite_member_small clearfix display_flex align_items_center">
	{{{makeMemberPreviewLinkImage member.id 36 false true}}}
	<div class="name_container overflow_ellipsis small_left_padding">
		{{#if member.profile.real_name}}
			<div class="bold">{{member.profile.real_name}}</div>
			<div class="subtle_silver not_in_token">{{member.name}}</div>
		{{else}}
			<div class="bold">{{member.name}}</div>
		{{/if}}
	</div>
	<i class="enter_icon ts_icon ts_icon_enter sky_blue not_in_token float_right small_top_margin" style="margin-left: auto;"></i>
</div></script>
	<script id="invite_member_token_template" type="text/x-handlebars-template"><div class="invite_member_token clearfix display_flex align_items_center">
	{{{makeMemberPreviewLinkImage member.id 24 false true}}}
	<div class="name_container overflow_ellipsis small_left_padding">{{getMemberDisplayName member}}</div>
</div></script>

<script id="app_update_modal_template" type="text/x-handlebars-template"><form id="app_update_form" action="/applications/{{app_id}}" method="post">
	<div class="service_modal">
		<h1 class="service_modal_heading">Update Rule</h1>
		<p class="service_modal_subheading">You can <strong>update the channel</strong> that this application posts to.</p>
		<label for="channel_id subtle_silver tiny">
			<span class="subtle_silver tiny">Choose a Channel</span>
			<input type="hidden" name="id" id="id" value="{{app_id}}" />
			<select id="channel_id" class="service_chosen" name="channel_id">
				<option value="">Choose a Channel...</option>
					{{#if channels}}
						<optgroup label="Channels">
							{{#each channels}}
								<option value="{{id}}">#{{name}}</option>
							{{/each}}
						</optgroup>
					{{/if}}
					{{#if im_channels}}
						<optgroup label="Direct Messages">
							{{#each im_channels}}
								<option value="{{id}}">@{{name}}</option>
							{{/each}}
						</optgroup>
					{{/if}}
					{{#if group_channels}}
						<optgroup label="Private Groups">
							{{#each group_channels}}
								<option value="{{id}}">{{name}}</option>
							{{/each}}
						</optgroup>
					{{/if}}
				</optgroup>
			</select>
		</label>
		<div class="service_modal_actions">
			<a class="btn btn_light btn_outline dialog_cancel">Cancel</a>
			<button type="submit" class="btn btn_light left_margin" href="/services/{$service.service.url_stub|escape}">Save</button>
		</div>
	</div>
</form>
</script>
<script id="app_destroy_modal_template" type="text/x-handlebars-template"><form id="app_destroy_form" action="/services/{{app_id}}?destroy=1" method="post">
	<div class="service_modal">
		<h1 class="service_modal_heading">Delete Rule</h1>
		<p class="service_modal_subheading">Are you sure you want to <strong>forever delete</strong> this rule - there's no undoing it.</p>
		<div class="service_modal_actions">
				<a class="btn btn_light btn_outline dialog_cancel">Cancel</a>
				<button type="submit" class="btn btn_light btn_danger left_margin">Delete</button>
			</div>
	</div>
</form>
</script>
<script id="generic_dialog_template" type="text/x-handlebars-template">{{!

Note: this template used to be inlined in TS.templates.source.js, and as a side effect of the way
we represented templates, all of the newlines were actually elided. So, that's what the crazy
things are around all of the line endings below. If you're refactoring this, future engineer,
feel free to take them out -- I just didn't want to change the meaning of the templates during
my refactoring. Love, Mark.

}}<div class="modal-header">{{!
}}	<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>{{!
}}	<h3>{{{title}}} <img src="{{versioned_loading_animation}}" width="16" height="16" class="throbber hidden"></h3>{{!
}}</div>{{!
}}<div class="modal-body" style="overflow-x: hidden;">{{!
}}	{{{body}}}{{!
}}</div>{{!
}}<div class="modal-footer">{{!
}}	<a style="cursor: pointer" class="btn btn_outline dialog_cancel" data-qa="generic_dialog_cancel"></a>{{!
}}	<a style="cursor: pointer" class="btn btn dialog_secondary_go hidden" data-qa="generic_dialog_secondary_go"></a>{{!
}}	<a style="cursor: pointer" class="btn dialog_go" data-qa="generic_dialog_go"></a>{{!
}}</div>
</script>
</script>
<script id="generic_dialog_sample_template" type="text/x-handlebars-template"><p><a class="btn btn_small" onclick="TS.generic_dialog.cancel(); $('#file-upload').trigger('click');">Choose a file</a> {{!
}}        OR <a class="btn btn_small" hhref="/files/create/snippet" target="{{newWindowName}}" onclick="TS.ui.snippet_dialog.startCreate(); TS.generic_dialog.cancel();">Create a text file</a></p>\
</script>
<script id="privacy_policy_dialog_template" type="text/x-handlebars-template"><div class="modal-content">{{!
}}	{{#if title}}{{!
}}		<div class="modal-header">{{!
}}			<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>{{!
}}		</div>{{!
}}	{{/if}}{{!
}}	<div class="modal-body" style="overflow-x: hidden;">{{!
}}		{{{body}}}{{!
}}	</div>{{!
}}	<div class="modal-footer">{{!
}}		{{#if footer}}{{!
}}			{{{footer}}}{{!
}}		{{/if}}{{!
}}	</div>{{!
}}</div>{{!
}}
</script>
<script id="app_slack_commands_modal_template" type="text/x-handlebars-template"><div class="paper_modal_header_chrome soft_grey_bg"></div>

<div class="paper_modal_header display_flex align_items_center justify_content_center">
	<p class="no_bottom_margin bold">
		{{title}}
	</p>
</div>

<div class="paper_modal_body">
	<form class="app_slack_commands_form margin_auto large_top_margin large_bottom_margin" action="/api/app.commands.{{api_function}}">
		<input type="hidden" name="app" value="{{app_id}}">
		<input type="hidden" name="token" value="{{token}}">
		{{#if command}}
			<input type="hidden" name="command" value="{{command}}">
		{{/if}}

		<div id="app_slack_commands_error_alert" class="alert alert_error hidden"><i class="ts_icon ts_icon_warning"></i> <span id="app_slack_commands_error_message">Command already exists.</span></div>

		<div class="app_slack_commands_form_section display_flex justify_content_between align_items_baseline top_border top_padding bottom_padding position_relative">
			<label for="name" class="no_bottom_margin no_wrap right_margin">Command</label>

			<div class="app_slack_commands_form_input_label_container">
				<input type="text" name="name" placeholder="/command" class="small no_bottom_margin overflow_ellipsis" value="{{name}}" autocomplete="off" data-validation data-validation-attr="required reservedwords={{reserved_commands}}" data-validation-for="name_validation_label">

				<label for="name_validation_label" class="app_slack_commands_form_validation_label plastic_grey small_top_margin no_bottom_margin"></label>
			</div>

			<i class="ts_icon ts_icon_info_circle subtle_silver help_icon"></i>
			<div class="app_slack_commands_info_tooltip small position_absolute neutral_white_bg normal_padding">
				<p class="no_bottom_margin">Slack Commands must start with a slash, be all lowercase, and contain no spaces. Examples: /deploy, /ack, /weather</p>
			</div>
		</div>

		<div class="app_slack_commands_form_section display_flex justify_content_between align_items_baseline top_border top_padding bottom_padding position_relative">
			<label for="url" class="no_bottom_margin no_wrap right_margin">Request URL</label>

			<div class="app_slack_commands_form_input_label_container">
				<input type="url" name="url" placeholder="https://example.com/slack/command" class="small no_bottom_margin overflow_ellipsis" value="{{url}}" data-validation data-validation-attr="required isurl=https" data-validation-for="url_validation_label">

				<label for="url_validation_label" class="app_slack_commands_form_validation_label plastic_grey small_top_margin no_bottom_margin"></label>
			</div>

			<i class="ts_icon ts_icon_info_circle subtle_silver help_icon"></i>
			<div class="app_slack_commands_info_tooltip small position_absolute neutral_white_bg normal_padding">
				<p class="no_bottom_margin">We'll send a request with information you might need to this URL when the command is run.</p>

				<br>

				<p class="no_bottom_margin">This URL should use the "https" protocol.</p>
			</div>
		</div>

		<div class="app_slack_commands_form_section display_flex justify_content_between align_items_baseline top_border top_padding bottom_padding">
			<label for="desc" class="no_bottom_margin no_wrap right_margin">Short Description</label>

			<div class="app_slack_commands_form_input_label_container">
				<input type="text" name="desc" placeholder="Launches the Rocket!" class="small no_bottom_margin overflow_ellipsis" value="{{desc}}" data-validation data-validation-attr="required" data-validation-for="desc_validation_label">

				<label for="desc_validation_label" class="app_slack_commands_form_validation_label plastic_grey small_top_margin no_bottom_margin"></label>
			</div>
		</div>

		<div class="app_slack_commands_form_section display_flex justify_content_between align_items_baseline top_border top_padding bottom_padding">
			<label for="usage" class="no_bottom_margin no_wrap right_margin">Usage Hint</label>

			<div class="app_slack_commands_form_input_label_container">
				<input type="text" name="usage" placeholder="[which rocket to launch]" class="small no_bottom_margin overflow_ellipsis" value="{{usage}}">

				<p class="no_bottom_margin small_top_margin plastic_grey">Optionally list any parameters that can be passed.</p>
			</div>
		</div>

		<div class="app_slack_commands_form_section top_border top_padding bottom_padding">
			<p class="small bold">Preview of Autocomplete Entry</p>
			<div class="preview_container small_padding bordered">
				<div class="preview_popup rounded neutral_white_bg bordered position_relative">
					<div class="preview_popup_title off_white_bg subtle_silver small_padding left_padding small">
						Commands matching "<span class="preview_popup_command_text bold"></span>"
					</div>
					<div class="app_label normal_margin small_bottom_margin display_flex subtle_silver">
						<span class="neutral_white_bg small_right_padding bold tiny">{{app_name}}</span>
						<hr class="no_margin flex_one top_margin">
					</div>
					<div class="normal_margin small display_flex small_top_margin">
						<div class="preview_popup_command_container overflow_ellipsis subtle_silver flex_one">
							<span class="bold indifferent_grey">
								/<span class="preview_popup_command_text"></span>
							</span>
							<span class="preview_popup_usage_text"></span>
						</div>
						<div class="preview_popup_desc_container left_padding float_right align_right">
							<span class="preview_popup_desc_text overflow_ellipsis subtle_silver"></span>
						</div>
					</div>
					<i class="arrow_box neutral_white_bg position_absolute"></i>
				</div>
				<div class="messages_input_container bordered neutral_white_bg top_margin rounded clearfix">
					<div class="file_upload_button float_left right_border align_center">
						<i class="ts_icon ts_icon_plus_thick cloud_silver bold"></i>
					</div>
					<div class="text_input float_left small left_padding">
						/<span class="preview_popup_command_text"></span>
					</div>
				</div>
			</div>
		</div>
	</form>
</div>

<div class="paper_modal_footer display_flex align_items_center justify_content_end normal_padding flexpane_grey_bg">
	<a class="btn btn_outline dialog_cancel">Cancel</a>
	<button class="btn left_margin dialog_go">Save</button>
</div>
</script>
<script id="existing_groups_template" type="text/x-handlebars-template">{{#if_equal existing_groups.length compare=1}}{{!
}}	The following group has the same members as the one you are trying to create. Would you like to use it instead?<br><br>{{!
}}{{else}}{{!
}}	The following groups have the same members as the one you are trying to create. Would you like to use one of them instead?<br><br>{{!
}}{{/if_equal}}{{!
}}{{#each existing_groups}}{{!
}}	<p class="small_bottom_margin" style="font-size:0.8rem; color:black"><span style="color: #AAA;">{{{groupPrefix}}}</span>{{this.name}}&nbsp;&nbsp;<a onclick="TS.ui.group_create_dialog.useExistingGroup('{{this.id}}')" class="btn btn_small ">{{#if this.is_archived}}unarchive{{else}}open{{/if}}</a></p>{{!
}}{{/each}}{{!
}}<br>{{!
}}If you really want to create a new group, just click the "create new group" button again.{{!
}}
</script>
<script id="issue_list_item_template" type="text/x-handlebars-template"><div class="issue_list_div issue_{{issue.state}}" id="{{makeIssueListDomId issue.id}}" data-issue-id="{{issue.id}}">{{!
}}	<div class="issue_list_left">{{!
}}		<div class="issue_list_title">{{issue.title}}</div>{{!
}}		<div class="issue_list_short_text">{{issue.short_text}}</div>{{!
}}	</div>{{!
}}	<div class="issue_list_right">{{!
}}		<div class="issue_list_state">{{issue.state}}{{#if_equal issue.state compare="unread"}} <i class="ts_icon ts_icon_exclamation_circle icon"></i>{{/if_equal}}</div>{{!
}}		<div class="issue_list_short_ts">{{toCalendarDateOrNamedDayShort issue.ts}} at {{toTime issue.ts}}</div>{{!
}}	</div>{{!
}}</div>{{!
}}
</script>
<script id="help_issue_div_template" type="text/x-handlebars-template"><p class="small_bottom_margin"><b>{{issue.title}}</b></p>{{!
}}{{#if show_comments}}{{!
}}	{{#each issue.comments}}{{!
}}		<div class="issue_comment_div">{{!
}}			<p class="small_bottom_margin"><b>{{this.from}}</b> <span class="issue_list_short_ts">{{toCalendarDateOrNamedDayShort this.ts}} at {{toTime this.ts}}</span></p>{{!
}}			{{{formatNoHighlightsNoSpecials this.text}}}{{!
}}		</div>{{!
}}	{{/each}}{{!
}}{{else}}{{!
}}	<div class="issue_comment_div">{{!
}}	</div>{{!
}}{{/if}}{{!
}}
</script>
<script id="help_issue_reply_comments_template" type="text/x-handlebars-template">{{#each issue.comments}}{{!
}}	<div class="issue_comment_div">{{!
}}		<p class="small_bottom_margin"><b>{{this.from}}</b> <span class="issue_list_short_ts">{{toCalendarDateOrNamedDayShort this.ts}} at {{toTime this.ts}}</span></p>{{!
}}		{{{formatNoHighlightsNoSpecials this.text}}}{{!
}}	</div>{{!
}}{{/each}}{{!
}}
</script>
<script id="message_attachment_template" type="text/x-handlebars-template">{{{initial_caret_html}}}{{!
}}<div {{#if real_src}}data-real-src="{{real_src}}"{{/if}} class="inline_attachment{{#unless expand_it}} hidden{{/unless}} {{max_width_class}}">{{!
	}}{{#if attachment.pretext}}{{!
		}}<div class="attachment_pretext">{{{formatMessageAttachmentPart attachment.pretext msg true attachment.mrkdwn_in_hash.pretext}}}</div>{{!
	}}{{/if}}{{!
	}}<div class="inline_attachment_wrapper{{#if is_standalone}} standalone{{/if}}">{{!
		}}<div class="attachment_bar" style="background:#{{bg_color}};"><div class="shim"></div></div>{{!
		}}<div class="content dynamic_content_max_width">{{!
			}}{{!
			}}{{#if thumb_at_top}}{{!
			}}{{#if small_thumb}}{{!
				}}<div class="msg_inline_attachment_thumb_holder at_top">{{!
					}}{{#if thumb_link}}<a {{{makeRefererSafeLink url=thumb_link}}} target="{{thumb_link}}">{{/if}}{{!
					}}{{!using style for width height is important! we must override default img styles}}{{!
					}}<img class="msg_inline_attachment_thumb" src="{{small_thumb_url}}" style="width:{{attachment._floated_thumb_display_width}}px; height:{{attachment._floated_thumb_display_height}}px;">{{!
					}}{{#if thumb_link}}</a>{{/if}}{{!
				}}</div>{{!
			}}{{/if}}{{!
			}}{{/if}}{{!
			}}{{!
			}}{{#if can_delete}}{{!
				}}<div class="delete_attachment_link" data-attachment-id="{{attachment.id}}"><i class="ts_icon ts_icon_times_small"></i></div>{{!
			}}{{/if}}{{!
			}}{{!
			}}<div>{{!
				}}{{#if attachment.service_icon}}<img class="attachment_service_icon" src="{{attachment.service_icon}}" width="16" height="16">{{/if}}{{!
				}}{{#if attachment.author_icon}}{{!
					}}{{#if attachment.author_link}}{{!
						}}<a {{{makeRefererSafeLink url=attachment.author_link}}} target="{{attachment.author_link}}"><img class="attachment_author_icon" src="{{attachment.author_icon}}" width="16" height="16"></a>{{!
						}}<a {{{makeRefererSafeLink url=attachment.author_link}}} target="{{attachment.author_link}}"><span class="attachment_author_name">{{attachment.author_name}}</span></a>{{!
						}}<a {{{makeRefererSafeLink url=attachment.author_link}}} target="{{attachment.author_link}}"><span class="attachment_author_subname">{{attachment.author_subname}}</span></a>{{!
					}}{{else}}{{!
						}}<img class="attachment_author_icon" src="{{attachment.author_icon}}" width="16" height="16">{{!
						}}<span class="attachment_author_name">{{attachment.author_name}}</span>{{!
						}}<span class="attachment_author_subname">{{attachment.author_subname}}</span>{{!
					}}{{/if}}{{!
				}}{{else}}{{!
					}}{{#if attachment.service_url}}{{!
						}}<a {{{makeRefererSafeLink url=attachment.service_url}}} target="{{attachment.service_url}}"><span class="attachment_service_name">{{attachment.service_name}}</span></a>{{!
					}}{{else}}{{!
						}}<span class="attachment_service_name">{{attachment.service_name}}</span>{{!
					}}{{/if}}{{!
				}}{{/if}}{{!
				}}{{#unless attachment.title}}{{#unless attachment.text}}{{#unless attachment.fields}}{{{media_caret_html}}}{{/unless}}{{/unless}}{{/unless}}{{!
			}}</div>{{!
			}}{{!
			}}{{#unless thumb_at_top}}{{!
			}}{{#if small_thumb}}{{!
				}}<div class="msg_inline_attachment_thumb_holder">{{!
					}}{{#if thumb_link}}<a {{{makeRefererSafeLink url=thumb_link}}} target="{{thumb_link}}">{{/if}}{{!
					}}{{!using style for width height is important! we must override default img styles}}{{!
					}}<img class="msg_inline_attachment_thumb" src="{{small_thumb_url}}" style="width:{{attachment._floated_thumb_display_width}}px; height:{{attachment._floated_thumb_display_height}}px;">{{!
					}}{{#if thumb_link}}</a>{{/if}}{{!
				}}</div>{{!
			}}{{/if}}{{!
			}}{{/unless}}{{!
			}}{{!
			}}{{#unless attachment.author_icon}}{{!
				}}{{#if attachment.author_link}}{{!
					}}<a {{{makeRefererSafeLink url=attachment.author_link}}} target="{{attachment.author_link}}"><span class="attachment_author_name">{{attachment.author_name}}</span></a>{{!
					}}<a {{{makeRefererSafeLink url=attachment.author_link}}} target="{{attachment.author_link}}"><span class="attachment_author_subname">{{attachment.author_subname}}</span></a>{{!
				}}{{else}}{{!
					}}{{#if attachment.author_name}}{{!
						}}<span class="attachment_author_name">{{attachment.author_name}}</span>{{!
						}}<span class="attachment_author_subname">{{attachment.author_subname}}</span>{{!
					}}{{/if}}{{!
				}}{{/if}}{{!
			}}{{/unless}}{{!
			}}{{!
			}}{{#if attachment.title}}{{!
				}}<div>{{!
					}}{{#if attachment.title_link}}{{!
						}}<span class="attachment_title"><a {{{makeRefererSafeLink url=attachment.title_link}}} target="{{attachment.title_link}}">{{{formatMessageAttachmentPart attachment.title msg true false enable_slack_action_links}}}</a></span>{{!
					}}{{else}}{{!
						}}<span class="attachment_title">{{{formatMessageAttachmentPart attachment.title msg true false enable_slack_action_links}}}</span>{{!
					}}{{/if}}{{!
					}}{{#unless attachment.text}}{{#unless attachment.fields}}{{{media_caret_html}}}{{/unless}}{{/unless}}{{!
				}}</div>{{!
			}}{{/if}}{{!
			}}{{!
			}}{{#if attachment.text}}{{!
				}}{{#feature flag="feature_more_field_in_message_attachments"}}{{!
					}}<div class="attachment_contents">{{!
						}}{{#if has_more}}{{!
							}}{{#if is_text_collapsed}}{{!
								}}<span class="short_text" data-all-text="{{formatMessageAttachmentPart attachment.text msg true attachment.mrkdwn_in_hash.text}}">{{{formatMessageAttachmentPart attachment._short_text msg true attachment.mrkdwn_in_hash.text enable_slack_action_links}}}</span>{{!
							}}{{else}}{{!
								}}<span class="short_text" data-all-text="{{formatMessageAttachmentPart attachment.text msg true attachment.mrkdwn_in_hash.text}}">{{{formatMessageAttachmentPart attachment.text msg true attachment.mrkdwn_in_hash.text enable_slack_action_links}}}{{!
							}}{{/if}}{{!
							}}<span id="{{makeMsgAttachmentTextExpanderDomId msg.ts attachment._index}}" class="rest_text_expander"{{#if attachment.more_hidetext}} data-hide-text="{{attachment.more_hidetext}}"{{/if}}> <a><br /><span>{{#if attachment.more_showtext}}{{attachment.more_showtext}}{{else}}Show more{{/if}}</span>{{#if attachment.more_hidetext}} <i class="attachment_caret ts_icon ts_icon_caret_right"></i>{{else}}...{{/if}}</a></span>{{!
							}}<span class="more_text hidden"><br />{{{formatMessageAttachmentPart attachment.more msg true attachment.mrkdwn_in_hash.text enable_slack_action_links}}}</span>{{!
						}}{{else}}{{!
							}}{{#if is_text_collapsed}}{{!
								}}<span class="short_text" data-all-text="{{formatMessageAttachmentPart attachment.text msg true attachment.mrkdwn_in_hash.text}}">{{{formatMessageAttachmentPart attachment._short_text msg true attachment.mrkdwn_in_hash.text enable_slack_action_links}}}</span>{{!
								}}<span id="{{makeMsgAttachmentTextExpanderDomId msg.ts attachment._index}}" class="rest_text_expander"> <a>Show more...</a></span>{{!
							}}{{else}}{{!
								}}{{{formatMessageAttachmentPart attachment.text msg true attachment.mrkdwn_in_hash.text enable_slack_action_links}}}{{!
							}}{{/if}}{{!
						}}{{/if}}{{!
						}}{{#unless attachment.fields}}{{{media_caret_html}}}{{/unless}}{{!
					}}</div>{{!
					}}{{#if attachment.footer}}<div class="attachment_footer">{{!
						}}{{{formatMessageAttachmentPart attachment.footer msg true attachment.mrkdwn_in_hash.footer enable_slack_action_links}}}{{!
					}}</div>{{/if}}{{!
					}}{{#if attachment.ts}}<div class="attachment_ts">{{!
						}}{{#if ts_link}}<a {{{makeRefererSafeLink url=ts_link}}} target="{{ts_link}}">{{/if}}{{!
						}}{{toCalendarDateOrNamedDayShort attachment.ts}} at {{toTime attachment.ts}}{{!
						}}{{#if ts_link}}</a>{{/if}}{{!
					}}</div>{{/if}}{{!
				}}{{else}}{{!
					}}<div class="attachment_contents">{{!
						}}{{#if is_text_collapsed}}{{!
							}}<span class="short_text" data-all-text="{{formatMessageAttachmentPart attachment.text msg true attachment.mrkdwn_in_hash.text}}">{{{formatMessageAttachmentPart attachment._short_text msg true attachment.mrkdwn_in_hash.text enable_slack_action_links}}}</span>{{!
							}}<span id="{{makeMsgAttachmentTextExpanderDomId msg.ts attachment._index}}" class="rest_text_expander"> <a>Show more...</a></span>{{!
						}}{{else}}{{!
							}}{{{formatMessageAttachmentPart attachment.text msg true attachment.mrkdwn_in_hash.text enable_slack_action_links}}}{{!
						}}{{/if}}{{!
						}}{{#unless attachment.fields}}{{{media_caret_html}}}{{/unless}}{{!
					}}</div>{{!
					}}{{#if attachment.footer}}<div class="attachment_footer">{{!
						}}{{{formatMessageAttachmentPart attachment.footer msg true attachment.mrkdwn_in_hash.footer enable_slack_action_links}}}{{!
					}}</div>{{/if}}{{!
					}}{{#if attachment.ts}}<div class="attachment_ts">{{!
						}}{{#if ts_link}}<a {{{makeRefererSafeLink url=ts_link}}} target="{{ts_link}}">{{/if}}{{!
						}}{{toCalendarDateOrNamedDayShort attachment.ts}} at {{toTime attachment.ts}}{{!
						}}{{#if ts_link}}</a>{{/if}}{{!
					}}</div>{{/if}}{{!
				}}{{/feature}}{{!
			}}{{/if}}{{!
			}}{{!
			}}{{#if attachment.fields}}{{!
				}}<div class="attachment_fields">{{!
				}}{{#if show_fields_table}}{{!
					}}<table class="" cellpadding="0" cellspacing="0" border="0" align="left"><tbody>{{!
					}}{{#foreach attachment.fields}}{{!
						}}{{#if this.value._new_row}}<tr>{{/if}}{{!
						}}<td valign="top" colspan="{{#if this.value.short}}1{{else}}2{{/if}}" {{#if this.value.short}}{{#if this.value._new_row}}width="250"{{/if}}{{/if}}>{{!
							}}<div class="attachment_field_title">{{{formatMessageAttachmentPart this.value.title msg false false}}}</div>{{!
							}}<i class="copy_only">----------------<br></i>{{!
							}}<div class="attachment_field_value {{#if this.value.short}}short{{/if}}">{{{formatMessageAttachmentPart this.value.value msg true ../attachment.mrkdwn_in_hash.fields ../enable_slack_action_links}}}<i class="copy_only"><br><br></i></div>{{!
						}}</td>{{!
					}}{{/foreach}}{{!
					}}</tbody></table>{{!
				}}{{else}}{{!
					}}{{#foreach long_fields}}{{!
						}}<span class="attachment_field_title">{{{formatMessageAttachmentPart this.value.title msg false false}}}</span>&nbsp;&nbsp;&nbsp;{{{formatMessageAttachmentPart this.value.value msg true ../attachment.mrkdwn_in_hash.fields}}}<br>{{!
					}}{{/foreach}}{{!
					}}{{#foreach short_fields}}{{!
						}}{{#unless this.first}}&nbsp;&nbsp;•&nbsp;&nbsp;{{/unless}}<span class="attachment_field_title">{{{formatMessageAttachmentPart this.value.title msg false false}}}</span>&nbsp;&nbsp;&nbsp;{{{formatMessageAttachmentPart this.value.value msg true ../attachment.mrkdwn_in_hash.fields ../enable_slack_action_links}}}{{!
					}}{{/foreach}}{{!
				}}{{/if}}{{!
				}}</div>{{!
				}}{{{media_caret_html}}}{{!
			}}{{/if}}{{!
			}}{{!
			}}{{#if attachment.other_html}}{{!
				}}{{{inlineOtherDiv attachment.other_html msg_dom_id attachment.safe_other_html expand_media}}}{{!
			}}{{/if}}{{!
			}}{{!
			}}{{#if attachment.video_html}}{{!
				}}{{#if attachment.thumb_url}}{{!
					}}{{#if attachment.from_url}}{{!
						}}{{{inlineVideoDiv attachment.from_url msg_dom_id expand_media}}}{{!
					}}{{else}}{{!
						}}{{{inlineVideoDiv attachment.thumb_url msg_dom_id expand_media}}}{{!
					}}{{/if}}{{!
				}}{{/if}}{{!
			}}{{else}}{{!
			}}{{/if}}{{!
			}}{{!
			}}{{#if attachment.image_url}}{{!
				}}{{#if attachment.from_url}}{{!
					}}{{{inlineImgDiv attachment.from_url msg_dom_id expand_media}}}{{!
				}}{{else}}{{!
					}}{{{inlineImgDiv attachment.image_url msg_dom_id expand_media}}}{{!
				}}{{/if}}{{!
			}}{{/if}}{{!
			}}{{!
			}}{{#if attachment.audio_html}}{{!
				}}{{{inlineAudioDiv attachment.audio_html msg_dom_id attachment.safe_audio_html expand_media}}}{{!
			}}{{else}}{{!
				}}{{#if attachment.audio_url}}{{!
					}}{{{formatSoundUrl attachment}}}{{!
				}}{{/if}}{{!
			}}{{/if}}{{!
			}}{{!
			}}{{#if show_action_links}}{{!
			}}{{#if attachment.actions}}{{!
				}}<div class="attachment_actions">{{!
				}}{{#foreach attachment.actions}}{{!
					}}{{{formatActionLink this.value msg ../enable_slack_action_links}}}{{!
					}}{{#unless this.last}} • {{/unless}}{{!
				}}{{/foreach}}{{!
				}}</div>{{!
			}}{{/if}}{{!
			}}{{/if}}{{!
		}}</div>{{!
	}}</div>{{!
}}</div>{{!
}}{{#if show_fallback}}<div class="attachment_fallback">{{#if attachment.fallback}}{{{formatMessageAttachmentPart attachment.fallback msg true attachment.mrkdwn_in_hash.fallback enable_slack_action_links}}}{{else}}NO FALLBACK PROVIDED{{/if}}</div>{{/if}}
</script>
<script id="messages_search_paging_template" type="text/x-handlebars-template"><div class="search_paging">{{!
	}}{{#if_not_equal pages compare=1}}{{#if_equal current_page compare=1}}<i class="left ts_icon ts_icon_chevron_circle_left disabled"></i>{{else}}<a onclick="TS.search.view.pageMessagesBack()"><i class="left ts_icon ts_icon_chevron_circle_left"></i></a>{{/if_equal}}{{/if_not_equal}}{{!
	}}<span class="page_text">page {{current_page}} of {{pages}}</span>{{!
	}}{{#if_not_equal pages compare=1}}{{#if_equal current_page compare=pages}}<i class="right ts_icon ts_icon_chevron_medium_right disabled"></i>{{else}}<a onclick="TS.search.view.pageMessagesForward()"><i class="right ts_icon ts_icon_chevron_circle_right"></i></a>{{/if_equal}}{{/if_not_equal}}{{!
}}</div>
</script>
<script id="files_search_paging_template" type="text/x-handlebars-template"><div class="search_paging">{{!
	}}{{#if_not_equal pages compare=1}}{{#if_equal current_page compare=1}}<i class="left ts_icon ts_icon_chevron_circle_left disabled"></i>{{else}}<a onclick="TS.search.view.pageFilesBack()"><i class="left ts_icon ts_icon_chevron_circle_left"></i></a>{{/if_equal}}{{/if_not_equal}}{{!
	}}<span class="page_text">page {{current_page}} of {{pages}}</span>{{!
	}}{{#if_not_equal pages compare=1}}{{#if_equal current_page compare=pages}}<i class="right ts_icon ts_icon_chevron_medium_right disabled"></i>{{else}}<a onclick="TS.search.view.pageFilesForward()"><i class="right ts_icon ts_icon_chevron_circle_right"></i></a>{{/if_equal}}{{/if_not_equal}}{{!
}}</div>
</script>
